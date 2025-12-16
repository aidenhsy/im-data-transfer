import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.scmOrderProd.procurement_orders.findMany({
    where: {
      order_date: '2025-12-14',
      type: 3,
    },
  });

  for (const order of orders) {
    // const scm = await database.scmProd.scm_order.findFirst({
    //   where: {
    //     reference_id: order.client_order_id,
    //   },
    // });

    const scm = await database.scmProd.scm_order_details.findFirst({
      where: {
        reference_order_id: order.client_order_id,
      },
      include: {
        scm_order: true,
      },
    });

    if (!scm) {
      console.log(order.client_order_id);
      continue;
    }

    console.log(
      scm.create_time,
      scm.scm_order.reference_id,
      order.client_order_id
    );
  }
};

run();
