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

const run = async () => {
  const imInventory = new ImInventory();
  const imProcurement = new ImProcurement();

  // 1) Create ONE workbook & all worksheets up front (add headers once)
  const workbook = new ExcelJS.Workbook();

  const wsSummary = workbook.addWorksheet('汇总表');
  wsSummary.addRow([
    '品牌',
    '门店',
    '品项类别',
    '期初时间',
    '期初金额',
    '本期入库金额',
    '期末时间',
    '期末金额',
    '本期使用金额',
  ]);

  const wsInDetails = workbook.addWorksheet('入库明细表');
  wsInDetails.addRow([
    '品牌',
    '门店',
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
  ]);

  const wsBeginCount = workbook.addWorksheet('期初盘点表');
  wsBeginCount.addRow([
    '品牌',
    '门店',
    '产品ID',
    '产品名称',
    '产品类别',
    '盘点加权品均单价',
    '盘点单位',
    '盘点数量',
    '盘点金额',
  ]);

  const wsEndCount = workbook.addWorksheet('期末盘点表');
  // (Fixed header to include 品牌/门店 to mirror 期初表)
  wsEndCount.addRow([
    '品牌',
    '门店',
    '产品ID',
    '产品名称',
    '产品类别',
    '盘点加权品均单价',
    '盘点单位',
    '盘点数量',
    '盘点金额',
  ]);

  const wsInvSummary = workbook.addWorksheet('盘点汇总明细表');
  // (Fixed order: header starts with 品牌/门店 and data will match)
  wsInvSummary.addRow([
    '品牌',
    '门店',
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
  ]);

  const wsWac = workbook.addWorksheet('加权平均计算表');
  wsWac.addRow([
    '品牌',
    '门店',
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
  ]);

  // 2) Loop shops, compute, and append rows to the same sheets
  for (const shopCount of tempCount) {
    const [shop, lastCount, finalCount] = await Promise.all([
      imInventory.scm_shop.findFirst({
        where: { id: shopCount.shop_id },
        select: {
          shop_name: true,
          cities: { select: { name: true } },
          scm_shop_brand: { select: { brand_name: true } },
        },
      }),
      shopCount.count_1
        ? imInventory.inventory_count.findFirst({
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
          })
        : null,
      shopCount.count_2
        ? imInventory.inventory_count.findFirst({
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
          })
        : null,
    ]);

    const emptyLastCount = {
      id: '',
      created_at: new Date('2025-07-01T00:00:00.000Z'),
      status: 1,
      inventory_count_details: [] as any[],
    };
    const emptyFinalCount = {
      id: '',
      created_at: new Date('2025-07-31T23:59:59.000Z'),
      status: 1,
      inventory_count_details: [] as any[],
    };

    const safeLastCount = lastCount
      ? { ...lastCount, created_at: new Date('2025-07-01T00:00:00.000Z') }
      : emptyLastCount;
    const safeFinalCount = finalCount
      ? { ...finalCount, created_at: new Date('2025-07-31T23:59:59.000Z') }
      : emptyFinalCount;

    if (
      (lastCount && lastCount.status === 0) ||
      (finalCount && finalCount.status === 0)
    ) {
      console.log('期初或期末数据未完成');
      process.exit(0);
    }

    const [orderDetails, wac] = await Promise.all([
      imProcurement.supplier_order_details.findMany({
        where: {
          supplier_orders: {
            status: { in: [4, 5] },
            shop_id: shopCount.shop_id,
            receive_time: {
              gt: safeLastCount.created_at,
              lt: safeFinalCount.created_at,
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
          created_at: {
            gte: safeLastCount.created_at,
            lt: safeFinalCount.created_at,
          },
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

    const lastCountTotal = sumBy(safeLastCount.inventory_count_details, (d) =>
      toNumber(d.count_value)
    );
    const finalCountTotal = sumBy(safeFinalCount.inventory_count_details, (d) =>
      toNumber(d.count_value)
    );
    console.log(
      `(${shop?.shop_name}) 期初: ${lastCountTotal}，期末: ${finalCountTotal}`
    );

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
      safeLastCount.inventory_count_details,
      (d) => d.supplier_items?.category_name || '未分类'
    );
    const finalByCategory = groupBy(
      safeFinalCount.inventory_count_details,
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

    // Build typed maps/records to avoid unknown/{} types
    const lastByItemId = new Map<string, any>();
    for (const d of safeLastCount.inventory_count_details as any[]) {
      const key: string | undefined = d?.supplier_items?.id;
      if (key) lastByItemId.set(key, d);
    }

    const finalByItemId = new Map<string, any>();
    for (const d of safeFinalCount.inventory_count_details as any[]) {
      const key: string | undefined = d?.supplier_items?.id;
      if (key) finalByItemId.set(key, d);
    }

    const ordersByItemId: Record<string, any[]> = groupBy<any, string>(
      orderDetails as any[],
      (d) => d.supplier_items?.id || ''
    );

    const allSupplierItemIds = new Set<string>([
      ...Array.from(lastByItemId.keys()),
      ...Array.from(finalByItemId.keys()),
      ...Object.keys(ordersByItemId).filter(Boolean),
    ]);

    // ---- 汇总表：append rows
    for (const cat of Array.from(allCategories)) {
      const lastAmt = toNumber(lastAmountByCategory[cat]);
      const inAmt = toNumber(orderInAmountByCategory[cat]);
      const finAmt = toNumber(finalAmountByCategory[cat]);
      const usedAmt = lastAmt + inAmt - finAmt;
      wsSummary.addRow([
        shop?.scm_shop_brand?.brand_name,
        shop?.shop_name,
        cat,
        safeLastCount.created_at,
        lastAmt,
        inAmt,
        safeFinalCount.created_at,
        finAmt,
        usedAmt,
      ]);
    }

    // ---- 入库明细表：append rows
    for (const od of orderDetails) {
      wsInDetails.addRow([
        shop?.scm_shop_brand?.brand_name,
        shop?.shop_name,
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
      ]);
    }

    // ---- 期初盘点表：append rows
    for (const d of safeLastCount.inventory_count_details) {
      wsBeginCount.addRow([
        shop?.scm_shop_brand?.brand_name,
        shop?.shop_name,
        d.supplier_items?.id,
        d.supplier_items?.name,
        d.supplier_items?.category_name,
        toNumber(d.weighted_price),
        d.supplier_items?.package_unit_name,
        toNumber(d.count_qty),
        toNumber(d.count_value),
      ]);
    }

    // ---- 期末盘点表：append rows (fixed to include 品牌/门店)
    for (const d of safeFinalCount.inventory_count_details) {
      wsEndCount.addRow([
        shop?.scm_shop_brand?.brand_name,
        shop?.shop_name,
        d.supplier_items?.id,
        d.supplier_items?.name,
        d.supplier_items?.category_name,
        toNumber(d.weighted_price),
        d.supplier_items?.package_unit_name,
        toNumber(d.count_qty),
        toNumber(d.count_value),
      ]);
    }

    // ---- 盘点汇总明细表：append rows (fixed to start with 品牌/门店)
    for (const id of allSupplierItemIds) {
      if (!id) continue;

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
            (last as any)?.supplier_items?.standard_units?.name
          ? `1 ${last.supplier_items.package_unit_name} = ${last.supplier_items.package_unit_to_base_ratio} ${last.supplier_items.standard_units.name}`
          : '';

      const lastQty = toNumber(last?.count_qty);
      const lastPrice = toNumber(last?.weighted_price);
      const lastVal = lastQty * lastPrice;

      const orders = ordersByItemId[id] || [];
      const inQty = sumBy(orders, (o) => toNumber(o.final_qty));
      const inVal = sumBy(orders, (o) => toNumber(o.total_final_amount));

      const finQty = toNumber(fin?.count_qty);
      const finPrice = toNumber(fin?.weighted_price);
      const finVal = finQty * finPrice;

      const usedQty = inQty - finQty;
      const usedVal = lastVal + inVal - finVal;

      wsInvSummary.addRow([
        shop?.scm_shop_brand?.brand_name,
        shop?.shop_name,
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
      ]);
    }

    // ---- 加权平均计算表：append rows
    for (const item of wac) {
      wsWac.addRow([
        shop?.scm_shop_brand?.brand_name,
        shop?.shop_name,
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
      ]);
    }
  }

  // 3) Write ONE file at the end
  const fileName = `7月全门店盘点明细.xlsx`;
  await workbook.xlsx.writeFile(fileName);
  console.log(`${fileName} 已生成`);
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
