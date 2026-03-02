import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.scmOrderProd.procurement_orders.findMany({
    where: {
      order_date: '2026-02-28',
      type: {
        in: [3, 9],
      },
    },
    select: {
      id: true,
      client_order_id: true,
      procurement_order_details: {
        select: {
          id: true,
          reference_id: true,
        },
      },
    },
  });

  const referenceids = orders.map((o) => o.client_order_id);

  const basicOrders = await database.scmProd.scm_order.findMany({
    where: {
      reference_id: {
        in: referenceids,
      },
    },
    select: {
      id: true,
      reference_id: true,
      scm_order_details: {
        select: {
          id: true,
          reference_id: true,
        },
      },
    },
  });

  console.log(orders.length);
  console.log(basicOrders.length);

  for (const order of orders) {
    const basicOrder = basicOrders.find(
      (o) => o.reference_id === order.client_order_id,
    );
    if (!basicOrder) {
      console.log(`Basic order ${order.client_order_id} not found`);
      continue;
    }
    console.log({
      order_id: order.client_order_id,
      order_length: order.procurement_order_details.length,
      basic_order_length: basicOrder.scm_order_details.length,
    });
  }
};

run();
