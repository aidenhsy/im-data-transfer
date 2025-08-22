import { PrismaClient as ImProcurement } from '../../prisma/clients/im-procurement-prod';
import { PrismaClient as ScmProd } from '../../prisma/clients/scm-prod';
import { PrismaClient as ScmOrder } from '../../prisma/clients/scm-order-prod';
import * as ExcelJS from 'exceljs';

const run = async () => {
  const imProcurement = new ImProcurement();
  const scmProd = new ScmProd();
  const scmOrder = new ScmOrder();

  const startDate = new Date('2025-08-01T00:00:00Z');
  const endDate = new Date('2025-08-30T23:59:59Z');

  const orderDetails = await imProcurement.supplier_order_details.findMany({
    orderBy: {
      supplier_orders: {
        receive_time: 'desc',
      },
    },
    select: {
      order_id: true,
      supplier_reference_id: true,
      order_qty: true,
      actual_delivery_qty: true,
      confirm_delivery_qty: true,
      final_qty: true,
      supplier_items: {
        select: {
          name: true,
        },
      },
    },
    where: {
      supplier_orders: {
        receive_time: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
  });
  const workbook = new ExcelJS.Workbook();
  const wsSummary = workbook.addWorksheet('三方对账');
  wsSummary.addRow([
    '客户订单ID',
    '参考ID',
    '商品名称',
    '类型',
    '供应商名称',
    'IM订货数量',
    'SCM订货数量',
    '中心出库订货数量',
    'IM发货数量',
    'SCM发货数量',
    '中心出库发货数量',
    'IM收货数量',
    'SCM收货数量',
    'IM最终数量',
    'SCM最终数量',
    '中心出库最终数量',
  ]);

  let length = orderDetails.length;
  let index = 0;
  console.log(`开始处理 ${length} 条订单`);

  for (const orderDetail of orderDetails) {
    if (index % 1000 === 0) {
      console.log(`处理第 ${index} 条订单，${length - index} 条未处理`);
    }
    index++;

    const scmOrderDetail = await scmOrder.procurement_order_details.findFirst({
      where: {
        procurement_orders: {
          client_order_id: orderDetail.order_id,
        },
        reference_id: orderDetail.supplier_reference_id,
      },
    });
    if (!scmOrderDetail) {
      console.log(
        `Order detail not found for order ${orderDetail.order_id} and reference ${orderDetail.supplier_reference_id}`
      );
      continue;
    }

    const scmProdDetail = await scmProd.scm_order_details.findFirst({
      where: {
        reference_id: orderDetail.supplier_reference_id,
        reference_order_id: orderDetail.order_id,
      },
      select: {
        num: true,
        deliver_goods_qty: true,
        delivery_qty: true,
        scm_goods: {
          select: {
            direct: true,
            supplier_scm_goods_seller_idTosupplier: {
              select: {
                supplier_name: true,
              },
            },
            supplier_scm_goods_supplier_idTosupplier: {
              select: {
                supplier_name: true,
              },
            },
          },
        },
      },
    });
    if (!scmProdDetail) {
      console.log(
        `Prod detail not found for order ${orderDetail.order_id} and reference ${orderDetail.supplier_reference_id}`
      );
      continue;
    }

    const obj = {
      client_order_id: orderDetail.order_id,
      reference_id: orderDetail.supplier_reference_id,
      item_name: orderDetail.supplier_items?.name,
      type: scmProdDetail.scm_goods?.direct === 0 ? '直配' : '统配',
      supplier_name:
        scmProdDetail.scm_goods?.direct === 0
          ? scmProdDetail.scm_goods?.supplier_scm_goods_seller_idTosupplier
              ?.supplier_name
          : scmProdDetail.scm_goods?.supplier_scm_goods_supplier_idTosupplier
              ?.supplier_name,
      // order qty
      imOrderQty: orderDetail.order_qty,
      scmOrderQty: scmOrderDetail.order_qty,
      scmProdOrderQty: scmProdDetail.num,
      // sent qty
      imSentQty: orderDetail.actual_delivery_qty,
      orderSentQty: scmOrderDetail.deliver_qty,
      scmSentQty: scmProdDetail.deliver_goods_qty,
      // receive qty
      imReceiveQty: orderDetail.confirm_delivery_qty,
      orderReceiveQty: scmOrderDetail.customer_receive_qty,
      // final qty
      imFinalQty: orderDetail.final_qty,
      orderFinalQty: scmOrderDetail.final_qty,
      scmFinalQty: scmProdDetail.delivery_qty,
    };
    wsSummary.addRow([
      obj.client_order_id,
      obj.reference_id,
      obj.item_name,
      obj.type,
      obj.supplier_name,
      obj.imOrderQty,
      obj.scmOrderQty,
      obj.scmProdOrderQty,
      obj.imSentQty,
      obj.orderSentQty,
      obj.scmSentQty,
      obj.imReceiveQty,
      obj.orderReceiveQty,
      obj.imFinalQty,
      obj.orderFinalQty,
      obj.scmFinalQty,
    ]);
  }
  const fileName = `三方对账-${startDate.toISOString().split('T')[0]}-${
    endDate.toISOString().split('T')[0]
  }.xlsx`;
  await workbook.xlsx.writeFile(fileName);
  console.log(`${fileName} 已生成`);
  process.exit(0);
};

run();
