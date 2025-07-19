import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';

const run = async () => {
  const imProcurement = new IMProcurement();
  const scm = new Scm();

  const data = await imProcurement.supplier_orders.findMany({
    where: {
      status: {
        in: [4, 5],
      },
    },
  });

  let i = 0;
  for (const order of data) {
    i++;
    const orderDetails = await scm.scm_order_details.findFirst({
      where: {
        reference_order_id: order.id,
      },
    });

    if (!orderDetails) {
      console.log(order.id, 'No order details');
      continue;
    }

    const scmOrder = await scm.scm_order.findFirst({
      where: {
        id: orderDetails?.order_id!,
      },
    });

    if (!scmOrder) {
      console.log(order.id, 'No scm order');
      continue;
    }

    const scmOrderStock = await scm.scm_order_stock.findMany({
      where: {
        order_id: scmOrder.id,
      },
    });

    if (scmOrder?.status !== 3) {
      await scm.scm_order.update({
        where: {
          id: scmOrder.id,
        },
        data: {
          status: 3,
        },
      });
      await scm.scm_order_stock.updateMany({
        where: {
          order_id: scmOrder.id,
        },
        data: {
          status: 3,
        },
      });
    }
  }
  console.log(i);
};

run();
