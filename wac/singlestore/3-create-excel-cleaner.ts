import * as ExcelJS from 'exceljs';
import { PrismaClient as ImInventory } from '../../prisma/clients/im-inventory-prod';
import { PrismaClient as ImProcurement } from '../../prisma/clients/im-procurement-prod';
import { orderStatus, orderType, wacType } from '../../util/order-status';
import tempCount from './temp-count.json';

// ---------- utils ----------
const toNumber = (v: any) => Number(v ?? 0);
const sumBy = <T>(arr: T[], pick: (x: T) => number) =>
  arr.reduce((acc, x) => acc + toNumber(pick(x)), 0);

function groupBy<T, K extends string | number | symbol>(
  arr: T[],
  keyFn: (x: T) => K | null | undefined
): Record<K, T[]> {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    if (key == null) return acc;
    (acc[key] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

// ---------- main ----------
const run = async () => {
  const imInventory = new ImInventory();
  const imProcurement = new ImProcurement();

  for (const shopCount of tempCount) {
    // 1) Fetch shop + both counts first
    const [shop, lastCount, finalCount] = await Promise.all([
      imInventory.scm_shop.findFirst({
        where: { id: shopCount.shop_id },
        select: { shop_name: true, cities: { select: { name: true } } },
      }),
      imInventory.inventory_count.findFirst({
        where: { id: shopCount.count_1 },
        select: {
          id: true,
          created_at: true,
          status: true,
          inventory_count_details: {
            select: {
              count_qty: true,
              count_value: true,
              weighted_price: true,
              supplier_items: {
                select: {
                  id: true,
                  name: true,
                  category_name: true,
                  package_unit_name: true,
                  package_unit_to_base_ratio: true,
                  standard_units: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
      imInventory.inventory_count.findFirst({
        where: { id: shopCount.count_2 },
        select: {
          id: true,
          created_at: true,
          status: true,
          inventory_count_details: {
            select: {
              count_qty: true,
              count_value: true,
              weighted_price: true,
              supplier_items: {
                select: {
                  id: true,
                  name: true,
                  category_name: true,
                  package_unit_name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // 2) Guard rails (now TypeScript will narrow lastCount/finalCount to non-null after this)
    if (!lastCount || !finalCount) {
      console.log('没有找到期初或期末数据');
      process.exit(0);
    }
    if (lastCount.status === 0 || finalCount.status === 0) {
      console.log('期初或期末数据未完成');
      process.exit(0);
    }

    // 3) Fetch orderDetails + wac
    const [orderDetails, wac] = await Promise.all([
      imProcurement.supplier_order_details.findMany({
        where: {
          supplier_orders: {
            status: { in: [4, 5] },
            shop_id: shopCount.shop_id,
            receive_time: {
              gt: lastCount.created_at,
              lt: finalCount.created_at,
            },
          },
        },
        orderBy: { supplier_orders: { created_at: 'desc' } },
        select: {
          id: true,
          order_id: true,
          supplier_item_id: true,
          price: true,
          order_qty: true,
          actual_delivery_qty: true,
          confirm_delivery_qty: true,
          final_qty: true,
          total_final_amount: true,
          supplier_items: {
            select: {
              id: true,
              name: true,
              category_name: true,
              package_unit_name: true,
              package_unit_to_base_ratio: true,
            },
          },
          generic_items: {
            select: { standard_units: { select: { name: true } } },
          },
          supplier_orders: {
            select: {
              created_at: true,
              delivery_time: true,
              receive_time: true,
              status: true,
              type: true,
            },
          },
        },
      }),
      imInventory.shop_item_weighted_price.findMany({
        where: {
          shop_id: shopCount.shop_id,
          created_at: { gte: lastCount.created_at, lt: finalCount.created_at },
        },
        orderBy: { created_at: 'asc' },
        select: {
          supplier_item_id: true,
          type: true,
          created_at: true,
          source_id: true,
          source_detail_id: true,
          weighted_price: true,
          total_qty: true,
          total_value: true,
          supplier_items: {
            select: { id: true, name: true, category_name: true },
          },
        },
      }),
    ]);

    // 3) Quick totals
    const lastCountTotal = sumBy(lastCount.inventory_count_details, (d) =>
      toNumber(d.count_value)
    );
    const finalCountTotal = sumBy(finalCount.inventory_count_details, (d) =>
      toNumber(d.count_value)
    );

    console.log(
      `期初盘点金额: ${lastCountTotal}\n期末盘点金额: ${finalCountTotal}`
    );

    // 4) Pre-compute lookups & aggregates
    // Category totals from order details (入库金额)
    const orderByCategory = groupBy(
      orderDetails,
      (d) => d.supplier_items?.category_name || '未分类'
    );
    const orderInAmountByCategory: Record<string, number> = {};
    for (const [cat, rows] of Object.entries(orderByCategory)) {
      orderInAmountByCategory[cat] = sumBy(rows, (r) =>
        toNumber(r.total_final_amount)
      );
    }

    const lastByCategory = groupBy(
      lastCount.inventory_count_details,
      (d) => d.supplier_items?.category_name || '未分类'
    );
    const finalByCategory = groupBy(
      finalCount.inventory_count_details,
      (d) => d.supplier_items?.category_name || '未分类'
    );

    const lastAmountByCategory: Record<string, number> = {};
    const finalAmountByCategory: Record<string, number> = {};
    const allCategories = new Set<string>([
      ...Object.keys(orderByCategory),
      ...Object.keys(lastByCategory),
      ...Object.keys(finalByCategory),
    ]);

    for (const cat of allCategories) {
      lastAmountByCategory[cat] = sumBy(lastByCategory[cat] || [], (r) =>
        toNumber(r.count_value)
      );
      finalAmountByCategory[cat] = sumBy(finalByCategory[cat] || [], (r) =>
        toNumber(r.count_value)
      );
    }

    // Per-supplier_item aggregates
    const lastByItemId = new Map(
      lastCount.inventory_count_details
        .map((d) => [d.supplier_items?.id, d])
        .filter(([k]) => !!k) as [
        string,
        (typeof lastCount.inventory_count_details)[number]
      ][]
    );

    const finalByItemId = new Map(
      finalCount.inventory_count_details
        .map((d) => [d.supplier_items?.id, d])
        .filter(([k]) => !!k) as [
        string,
        (typeof finalCount.inventory_count_details)[number]
      ][]
    );

    const ordersByItemId = groupBy(
      orderDetails,
      (d) => d.supplier_items?.id || null
    );

    const allSupplierItemIds = new Set<string>([
      ...Array.from(lastByItemId.keys()),
      ...Array.from(finalByItemId.keys()),
      ...Object.keys(ordersByItemId),
    ]);

    // 5) Build Excel
    const workbook = new ExcelJS.Workbook();

    // ---- 汇总表 ----
    {
      const ws = workbook.addWorksheet('汇总表');
      ws.addRow([
        '品项类别',
        '期初时间',
        '期初金额',
        '本期入库金额',
        '期末时间',
        '期末金额',
        '本期使用金额',
      ]).commit();

      for (const cat of Array.from(allCategories)) {
        const lastAmt = toNumber(lastAmountByCategory[cat]);
        const inAmt = toNumber(orderInAmountByCategory[cat]);
        const finAmt = toNumber(finalAmountByCategory[cat]);
        const usedAmt = lastAmt + inAmt - finAmt;

        ws.addRow([
          cat,
          lastCount.created_at,
          lastAmt,
          inAmt,
          finalCount.created_at,
          finAmt,
          usedAmt,
        ]).commit();
      }
    }

    // ---- 入库明细表 ----
    {
      const ws = workbook.addWorksheet('入库明细表');
      ws.addRow([
        '产品名称',
        '产品类别',
        '订单ID',
        '订单详情ID',
        '商品ID',
        '下单时间',
        '发货时间',
        '收货时间',
        '状态',
        '订单类型',
        '门店名称',
        '城市名称',
        '报货单位',
        '报货单位换算',
        '最小单位',
        '销售单价',
        '订货数量',
        '发货数量',
        '收货数量',
        '最终数量',
        '最终销售金额',
      ]).commit();

      for (const od of orderDetails) {
        ws.addRow([
          od.supplier_items?.name,
          od.supplier_items?.category_name,
          od.order_id,
          od.id,
          od.supplier_item_id,
          od.supplier_orders.created_at,
          od.supplier_orders.delivery_time,
          od.supplier_orders.receive_time,
          orderStatus(od.supplier_orders.status),
          orderType(od.supplier_orders.type),
          shop?.shop_name,
          shop?.cities?.name,
          od.supplier_items?.package_unit_name,
          toNumber(od.supplier_items?.package_unit_to_base_ratio),
          od.generic_items?.standard_units?.name,
          toNumber(od.price),
          toNumber(od.order_qty),
          toNumber(od.actual_delivery_qty),
          toNumber(od.confirm_delivery_qty),
          toNumber(od.final_qty),
          toNumber(od.total_final_amount),
        ]).commit();
      }
    }

    // ---- 期初盘点表 ----
    {
      const ws = workbook.addWorksheet('期初盘点表');
      ws.addRow([
        '产品ID',
        '产品名称',
        '产品类别',
        '盘点加权品均单价',
        '盘点单位',
        '盘点数量',
        '盘点金额',
      ]).commit();

      for (const d of lastCount.inventory_count_details) {
        ws.addRow([
          d.supplier_items?.id,
          d.supplier_items?.name,
          d.supplier_items?.category_name,
          toNumber(d.weighted_price),
          d.supplier_items?.package_unit_name,
          toNumber(d.count_qty),
          toNumber(d.count_value),
        ]).commit();
      }
    }

    // ---- 期末盘点表 ----
    {
      const ws = workbook.addWorksheet('期末盘点表');
      ws.addRow([
        '产品ID',
        '产品名称',
        '产品类别',
        '盘点加权品均单价',
        '盘点单位',
        '盘点数量',
        '盘点金额',
      ]).commit();

      for (const d of finalCount.inventory_count_details) {
        ws.addRow([
          d.supplier_items?.id,
          d.supplier_items?.name,
          d.supplier_items?.category_name,
          toNumber(d.weighted_price),
          d.supplier_items?.package_unit_name,
          toNumber(d.count_qty),
          toNumber(d.count_value),
        ]).commit();
      }
    }

    // ---- 盘点汇总明细表 ----
    {
      const ws = workbook.addWorksheet('盘点汇总明细表');
      ws.addRow([
        '产品类别',
        '产品名称',
        '产品ID',
        '规格',
        '单位',
        '期初数量',
        '期初加权平均价格',
        '期初库存金额',
        '本期入库数量',
        '本期入库金额',
        '期末数量',
        '期末加权平均价格',
        '期末库存金额',
        '本期使用数量',
        '本期使用金额',
      ]).commit();

      for (const id of allSupplierItemIds) {
        if (!id) continue;

        // Prefer pulling meta from last/final/order—fallback to any
        const last = lastByItemId.get(id);
        const fin = finalByItemId.get(id);
        const anyOrder = (ordersByItemId[id] || [])[0];

        const category =
          last?.supplier_items?.category_name ??
          fin?.supplier_items?.category_name ??
          anyOrder?.supplier_items?.category_name ??
          '未分类';

        const name =
          last?.supplier_items?.name ??
          fin?.supplier_items?.name ??
          anyOrder?.supplier_items?.name ??
          id;

        const unit =
          last?.supplier_items?.package_unit_name ??
          fin?.supplier_items?.package_unit_name ??
          anyOrder?.supplier_items?.package_unit_name ??
          '';

        const spec =
          anyOrder?.supplier_items?.package_unit_name &&
          anyOrder?.generic_items?.standard_units?.name
            ? `1 ${anyOrder.supplier_items.package_unit_name} = ${anyOrder.supplier_items.package_unit_to_base_ratio} ${anyOrder.generic_items.standard_units.name}`
            : last?.supplier_items?.package_unit_name &&
              last?.supplier_items?.standard_units?.name
            ? `1 ${last.supplier_items.package_unit_name} = ${last.supplier_items.package_unit_to_base_ratio} ${last.supplier_items.standard_units.name}`
            : '';

        const lastQty = toNumber(last?.count_qty);
        const lastPrice = toNumber(last?.weighted_price);
        const lastVal = lastQty * lastPrice;

        // Aggregate orders for this item (in case there are multiple)
        const orders = ordersByItemId[id] || [];
        const inQty = sumBy(orders, (o) => toNumber(o.order_qty));
        const inVal = sumBy(
          orders,
          (o) => toNumber(o.order_qty) * toNumber(o.price)
        );

        const finQty = toNumber(fin?.count_qty);
        const finPrice = toNumber(fin?.weighted_price);
        const finVal = finQty * finPrice;

        const usedQty = inQty - finQty; // mirrors your original formula
        const usedVal = lastVal + inVal - finVal;

        ws.addRow([
          category,
          name,
          id,
          spec,
          unit,
          lastQty,
          lastPrice,
          lastVal,
          inQty,
          inVal,
          finQty,
          finPrice,
          finVal,
          usedQty,
          usedVal,
        ]).commit();
      }
    }

    // ---- 加权平均计算表 ----
    {
      const ws = workbook.addWorksheet('加权平均计算表');
      ws.addRow([
        '产品ID',
        '产品名称',
        '产品类别',
        '类型',
        '创建时间时间',
        '来源ID',
        '来源详情ID',
        '盘点加权品均单价',
        '库存总数量',
        '库存总金额',
      ]).commit();

      for (const item of wac) {
        ws.addRow([
          item.supplier_items?.id,
          item.supplier_items?.name,
          item.supplier_items?.category_name,
          wacType(item.type),
          item.created_at,
          item.source_id,
          item.source_detail_id,
          toNumber(item.weighted_price),
          toNumber(item.total_qty),
          toNumber(item.total_value),
        ]).commit();
      }
    }

    const fileName = `${shop?.shop_name || '门店'}-7月盘点明细.xlsx`;
    await workbook.xlsx.writeFile(fileName);
    console.log(`${fileName} 已生成`);
  }
  console.log('done');
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
