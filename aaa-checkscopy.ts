import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from './prisma/clients/scm-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';

const run = async () => {
  const procurementDB = new Procurement();
  const basicDB = new Basic();
  const orderDB = new Order();

  const details = await procurementDB.supplier_order_details.findMany({
    where: {
      supplier_orders: {
        receive_time: null,
        status: {
          in: [4, 5],
        },
      },
    },
  });

  console.log(details.length);

  for (const detail of details) {
    const scmOrderDetail = await orderDB.procurement_order_details.findFirst({
      where: {
        reference_id: detail.supplier_reference_id,
        procurement_orders: {
          client_order_id: detail.order_id,
        },
      },
    });
    if (!scmOrderDetail) {
      console.log(detail.supplier_reference_id);
      continue;
    }

    const scmDetail = await basicDB.scm_order_details.findFirst({
      where: {
        reference_id: scmOrderDetail.reference_id,
        reference_order_id: detail.order_id,
      },
      select: {
        delivery_qty: true,
        scm_order: {
          select: {
            arrival_time: true,
          },
        },
      },
    });

    if (!scmDetail) {
      console.log(detail.supplier_reference_id);
      continue;
    }

    await procurementDB.supplier_orders.update({
      where: {
        id: detail.order_id,
      },
      data: {
        sent_time: scmDetail.scm_order.arrival_time,
        receive_time: scmDetail.scm_order.arrival_time,
      },
    });

    await orderDB.procurement_orders.update({
      where: {
        id: scmOrderDetail.order_id,
      },
      data: {
        customer_receive_time: scmDetail.scm_order.arrival_time,
        sent_time: scmDetail.scm_order.arrival_time,
      },
    });
  }
};

run();
