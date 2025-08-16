import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from './prisma/clients/scm-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';

const run = async () => {
  const procurementDB = new Procurement();
  const basicDB = new Basic();
  const orderDB = new Order();

  const orderDetails = await procurementDB.supplier_order_details.findMany({
    where: {
      supplier_orders: {
        receive_time: {
          gt: '2025-06-01T00:00:00.000Z',
          lt: '2025-06-30T23:59:59.999Z',
        },
      },
    },
  });

  for (const orderDetail of orderDetails) {
    const scmLinkedRecord = await basicDB.scm_order_details.findFirst({
      where: {
        reference_order_id: orderDetail.order_id,
        reference_id: orderDetail.supplier_reference_id,
      },
    });
    if (!scmLinkedRecord) {
      console.log(orderDetail.order_id, orderDetail.supplier_reference_id);
      continue;
    }

    if (
      Number(orderDetail.final_qty) !== Number(scmLinkedRecord.delivery_qty)
    ) {
      console.log(
        'not equal',
        orderDetail.final_qty,
        scmLinkedRecord.delivery_qty
      );
    }
  }
  console.log('done');
};

run();
