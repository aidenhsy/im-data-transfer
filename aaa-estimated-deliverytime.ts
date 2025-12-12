import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.scmOrderProd.procurement_orders.findMany({
    where: {
      order_date: '2025-12-11',
      type: 9,
    },
  });

  for (const order of orders) {
    const scmOrder = await database.scmProd.scm_order_details.findMany({
      where: {
        reference_order_id: order.client_order_id,
      },
      distinct: ['order_id'],
    });

    for (const scm of scmOrder) {
      console.log(scm.order_id);
      await database.scmProd.scm_order.update({
        where: {
          id: scm.order_id,
        },
        data: {
          estimated_delivery_time: '2025-12-12T07:00:00Z',
        },
      });
    }
  }
};

run();
