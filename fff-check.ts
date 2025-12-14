import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.scmOrderProd.procurement_orders.findMany({
    where: {
      type: 3,
      order_date: '2025-12-13',
    },
    include: {
      procurement_order_details: true,
    },
  });

  for (const order of orders) {
    console.log(`Checking order: ${order.id}`);
    const findScm = await database.scmProd.scm_order_details.findMany({
      where: {
        reference_order_id: order.client_order_id,
      },
      include: {
        scm_order: true,
      },
    });
    for (const detail of findScm) {
      await database.scmProd.scm_order_details.update({
        where: {
          id: detail.id,
        },
        data: {
          create_time: '2025-12-14T09:00:00.000Z',
        },
      });
    }

    const uniqueOrderIds = [
      ...new Set(findScm.map((detail) => detail.scm_order.id)),
    ];

    for (const orderId of uniqueOrderIds) {
      await database.scmProd.scm_order.update({
        where: {
          id: orderId,
        },
        data: {
          create_time: '2025-12-14T09:00:00.000Z',
        },
      });
    }

    console.log(
      `${findScm.length} vs ${order.procurement_order_details.length}`
    );
  }
};

run();
