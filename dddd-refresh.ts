import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.scmOrderProd.procurement_orders.findMany({
    where: {
      status: 3,
    },
    include: {
      procurement_order_details: true,
    },
  });

  for (const order of orders) {
    const zeros = order.procurement_order_details.filter(
      (detail) => detail.deliver_qty === null
    );
    if (zeros.length > 0) {
      console.log(order.id, zeros.length);
      continue;
    }

    await database.scmOrderProd.procurement_orders.update({
      where: {
        id: order.id,
      },
      data: {
        status: 1,
      },
    });
    await database.scmOrderProd.procurement_orders.update({
      where: {
        id: order.id,
      },
      data: {
        status: 3,
      },
    });
    console.log(`Order ${order.id} refreshed`);
  }
};

run();
