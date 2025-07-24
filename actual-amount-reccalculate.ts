import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';
import { PrismaClient as ImProcurement } from './prisma/clients/im-procurement-prod';

const run = async () => {
  const scmOrder = new ScmOrder();
  const imProcurement = new ImProcurement();

  const proOrders = await imProcurement.supplier_orders.findMany({
    where: {
      status: {
        in: [4, 5],
      },
      actual_amount: {
        gt: 20000,
      },
    },
    include: {
      supplier_order_details: true,
    },
  });

  for (const order of proOrders) {
    const actualAmount = order.supplier_order_details.reduce((acc, detail) => {
      return acc + Number(detail.final_qty) * Number(detail.price);
    }, 0);

    // Round to 2 decimal places using the most accurate method
    const roundedActualAmount = Math.round(actualAmount * 100) / 100;

    await imProcurement.supplier_orders.update({
      where: {
        id: order.id,
      },
      data: {
        actual_amount: roundedActualAmount,
      },
    });

    const scmOrderFind = await scmOrder.procurement_orders.findFirst({
      where: {
        client_order_id: order.id,
      },
    });

    if (!scmOrderFind) {
      console.log('!! no scm order', order.id);
      continue;
    }

    await scmOrder.procurement_orders.update({
      where: {
        id: scmOrderFind.id,
      },
      data: {
        actual_amount: roundedActualAmount,
      },
    });
  }
};

run();
