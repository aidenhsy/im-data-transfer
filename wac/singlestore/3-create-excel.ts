import * as ExcelJS from 'exceljs';
import { PrismaClient as ImInventory } from '../../prisma/clients/im-inventory-prod';
import { PrismaClient as ImProcurement } from '../../prisma/clients/im-procurement-prod';
import { orderStatus, orderType, wacType } from '../../util/order-status';

const run = async () => {
  const imInventory = new ImInventory();
  const imProcurement = new ImProcurement();

  const shopId = 3;

  const shop = await imInventory.scm_shop.findFirst({
    where: {
      id: shopId,
    },
    include: {
      cities: true,
    },
  });

  const lastCount = await imInventory.inventory_count.findFirst({
    include: {
      inventory_count_details: {
        include: {
          supplier_items: true,
        },
      },
    },
    where: {
      shop_id: shopId,
      created_at: '2025-06-30T21:00:00.000000Z',
    },
  });

  const finalCount = await imInventory.inventory_count.findFirst({
    include: {
      inventory_count_details: {
        include: {
          supplier_items: true,
        },
      },
    },
    where: {
      shop_id: shopId,
      created_at: '2025-07-31T21:00:00.000000Z',
    },
  });

  if (!lastCount || !finalCount) {
    console.log('没有找到期初或期末数据');
    process.exit(0);
  }
  if (lastCount.status === 0 || finalCount.status === 0) {
    console.log('期初或期末数据未完成');
    process.exit(0);
  }

  const lastCountTotal = lastCount.inventory_count_details.reduce(
    (acc, curr) => acc + Number(curr.count_value),
    0
  );

  const finalCountTotal = finalCount.inventory_count_details.reduce(
    (acc, curr) => acc + Number(curr.count_value),
    0
  );

  console.log(
    `期初盘点金额: ${lastCountTotal}\n期末盘点金额: ${finalCountTotal}`
  );

  const orderDetails = await imProcurement.supplier_order_details.findMany({
    include: {
      supplier_orders: true,
      supplier_items: true,
      generic_items: {
        include: {
          standard_units: true,
        },
      },
    },
    orderBy: {
      supplier_orders: {
        created_at: 'desc',
      },
    },
    where: {
      supplier_orders: {
        status: {
          in: [4, 5],
        },
        shop_id: shopId,
        receive_time: {
          gt: '2025-06-30T21:00:00.000000Z',
          lt: '2025-07-31T21:00:00.000000Z',
        },
      },
    },
  });

  const workbook = new ExcelJS.Workbook();

  // 汇总表
  const worksheetSummary = workbook.addWorksheet('汇总表');

  const headersSummary = [
    '品项类别',
    '期初时间',
    '期初金额',
    '本期入库金额',
    '期末时间',
    '期末金额',
    '本期使用金额',
  ];
  worksheetSummary.addRow(headersSummary).commit();
  const categorys = orderDetails.map(
    (item) => item.supplier_items?.category_name
  );
  const uniqueCategorys = [...new Set(categorys)];

  for (const category of uniqueCategorys) {
    const categoryOrderDetails = orderDetails.filter(
      (item) => item.supplier_items?.category_name === category
    );

    const categoryOrderInAmount = categoryOrderDetails.reduce((acc, curr) => {
      return acc + Number(curr.total_final_amount);
    }, 0);

    const categoryLastCount = lastCount.inventory_count_details.filter(
      (item) => item.supplier_items?.category_name === category
    );

    const categoryLastCountAmount = categoryLastCount.reduce((acc, curr) => {
      return acc + Number(curr.count_value);
    }, 0);

    const categoryFinalCount = finalCount.inventory_count_details.filter(
      (item) => item.supplier_items?.category_name === category
    );

    const categoryFinalCountAmount = categoryFinalCount.reduce((acc, curr) => {
      return acc + Number(curr.count_value);
    }, 0);

    worksheetSummary
      .addRow([
        category,
        lastCount?.created_at,
        Number(categoryLastCountAmount),
        Number(categoryOrderInAmount),
        finalCount?.created_at,
        Number(categoryFinalCountAmount),
        Number(categoryOrderInAmount - categoryFinalCountAmount),
      ])
      .commit();
  }

  // 采购明细表
  const worksheetOrderDetails = workbook.addWorksheet('入库明细表');

  const headersOrderDetails = [
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
  ];

  worksheetOrderDetails.addRow(headersOrderDetails).commit();

  for (const orderDetail of orderDetails) {
    worksheetOrderDetails
      .addRow([
        orderDetail.supplier_items?.name,
        orderDetail.supplier_items?.category_name,
        orderDetail.order_id,
        orderDetail.id,
        orderDetail.supplier_item_id,
        orderDetail.supplier_orders.created_at,
        orderDetail.supplier_orders.delivery_time,
        orderDetail.supplier_orders.receive_time,
        orderStatus(orderDetail.supplier_orders.status),
        orderType(orderDetail.supplier_orders.type),
        shop?.shop_name,
        shop?.cities?.name,
        orderDetail.supplier_items?.package_unit_name,
        Number(orderDetail.supplier_items?.package_unit_to_base_ratio),
        orderDetail.generic_items?.standard_units?.name,
        Number(orderDetail.price),
        Number(orderDetail.order_qty),
        Number(orderDetail.actual_delivery_qty),
        Number(orderDetail.confirm_delivery_qty),
        Number(orderDetail.final_qty),
        Number(orderDetail.total_final_amount),
      ])
      .commit();
  }

  // 期初盘点表
  const worksheetInitialInventory = workbook.addWorksheet('期初盘点表');

  const headersInitialInventory = [
    '产品ID',
    '产品名称',
    '产品类别',
    '盘点加权品均单价',
    '盘点单位',
    '盘点数量',
    '盘点金额',
  ];

  worksheetInitialInventory.addRow(headersInitialInventory).commit();

  for (const detail of lastCount.inventory_count_details) {
    worksheetInitialInventory
      .addRow([
        detail.supplier_items?.id,
        detail.supplier_items?.name,
        detail.supplier_items?.category_name,
        Number(detail.weighted_price),
        detail.supplier_items?.package_unit_name,
        Number(detail.count_qty),
        Number(detail.count_value),
      ])
      .commit();
  }

  // 期末盘点表
  const worksheetFinalInventory = workbook.addWorksheet('期末盘点表');
  const headersFinalInventory = [
    '产品ID',
    '产品名称',
    '产品类别',
    '盘点加权品均单价',
    '盘点单位',
    '盘点数量',
    '盘点金额',
  ];
  worksheetFinalInventory.addRow(headersFinalInventory).commit();

  for (const detail of finalCount.inventory_count_details) {
    worksheetFinalInventory
      .addRow([
        detail.supplier_items?.id,
        detail.supplier_items?.name,
        detail.supplier_items?.category_name,
        Number(detail.weighted_price),
        detail.supplier_items?.package_unit_name,
        Number(detail.count_qty),
        Number(detail.count_value),
      ])
      .commit();
  }

  // 加权平均计算表
  const wac = await imInventory.shop_item_weighted_price.findMany({
    include: {
      supplier_items: true,
    },
    orderBy: {
      created_at: 'asc',
    },
    where: {
      shop_id: shopId,
      created_at: {
        gte: '2025-06-30T00:00:00.000000Z',
        lt: '2025-07-31T21:00:00.000000Z',
      },
    },
  });

  const worksheetWeightedAverage = workbook.addWorksheet('加权平均计算表');

  const headersWeightedAverage = [
    '产品ID',
    '产品名称',
    '产品类别',
    '类型', // 采购入库, 盘点
    '创建时间时间',
    '来源ID',
    '来源详情ID',
    '盘点加权品均单价',
    '库存总数量',
    '库存总金额',
  ];

  worksheetWeightedAverage.addRow(headersWeightedAverage).commit();

  for (const item of wac) {
    worksheetWeightedAverage
      .addRow([
        item.supplier_items?.id,
        item.supplier_items?.name,
        item.supplier_items?.category_name,
        wacType(item.type),
        item.created_at,
        item.source_id,
        item.source_detail_id,
        Number(item.weighted_price),
        Number(item.total_qty),
        Number(item.total_value),
      ])
      .commit();
  }

  await workbook.xlsx.writeFile(`${shop?.shop_name}-7月盘点明细.xlsx`);
  console.log(`${shop?.shop_name}-7月盘点明细.xlsx 已生成`);
  process.exit(0);
};

run();
