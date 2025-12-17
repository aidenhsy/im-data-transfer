import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.scmOrderProd.procurement_orders.findMany({
    where: {
      order_date: '2025-12-15',
      type: 3,
      status: {
        notIn: [4],
      },
    },
    include: {
      procurement_order_details: true,
    },
  });

  for (const order of orders) {
    console.log(`checking order ${order.client_order_id}`);
    await database.scmOrderProd.procurement_orders.update({
      where: {
        id: order.id,
      },
      data: {
        status: 3,
      },
    });
  }
};

run();
