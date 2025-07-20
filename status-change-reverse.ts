import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';

const run = async () => {
  const imProcurement = new IMProcurement();
  const scmOrder = new ScmOrder();
  const scm = new Scm();

  const data = await scm.scm_order.findMany({
    where: {
      order_no: {
        in: [
          '135_20250714153432_1',
          '129_20250714153430_1',
          '52_20250630211015_1',
          '49_20250630211015_1',
          '44_20250630211015_1',
        ],
      },
    },
    include: {
      scm_order_details: true,
    },
  });

  for (const order of data) {
    await scm.scm_order.update({
      where: {
        id: order.id,
      },
      data: {
        status: 3,
      },
    });
    await scm.scm_order_stock.updateMany({
      where: {
        order_id: order.id,
      },
      data: {
        status: 3,
      },
    });
  }

  for (const order of data) {
    let orderId = '';
    for (const detail of order.scm_order_details) {
      if (!detail.reference_order_id) {
        console.log(detail.id, 'No reference order id');
        break;
      }

      if (detail.reference_order_id) {
        orderId = detail.reference_order_id;
        break;
      }
    }
    if (orderId.length === 0) {
      console.log(order.id, 'No order id');
      continue;
    }

    const imProcurementOrder = await imProcurement.supplier_orders.findFirst({
      where: {
        id: orderId,
      },
    });

    if (!imProcurementOrder) {
      console.log(orderId, 'No im procurement order');
      continue;
    }

    const sssorder = await scmOrder.procurement_orders.findFirst({
      where: {
        client_order_id: imProcurementOrder.id,
      },
    });

    if (!sssorder) {
      console.log(orderId, 'No sss order');
      continue;
    }

    await scmOrder.procurement_orders.update({
      where: {
        id: sssorder.id,
      },
      data: {
        status: 4,
      },
    });
    await imProcurement.supplier_orders.update({
      where: {
        id: imProcurementOrder.id,
      },
      data: {
        status: 4,
      },
    });
    // for (const detail of order.scm_order_details) {
    //   const imDetail = await imProcurement.supplier_order_details.findFirst({
    //     where: {
    //       supplier_reference_id: detail.reference_id!,
    //       supplier_orders: {
    //         id: detail.reference_order_id!,
    //       },
    //     },
    //   });

    //   if (!imDetail) {
    //     console.log(detail.id, 'No im detail');
    //     continue;
    //   }
    // }
  }
};

run();
