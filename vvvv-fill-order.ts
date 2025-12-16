import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.scmOrderProd.procurement_orders.findMany({
    where: {
      order_date: '2025-12-14',
      type: 3,
    },
    include: {
      procurement_order_details: true,
    },
  });

  for (const order of orders) {
    console.log(`checking order ${order.client_order_id}`);
    // let orderId: number;
    // const scmOrder = await database.scmProd.scm_order.findFirst({
    //   where: {
    //     reference_id: order.client_order_id,
    //   },
    // });
    // if (scmOrder) {
    //   orderId = scmOrder.id;
    // } else {
    //   const newOrder = await database.scmProd.scm_order.create({
    //     data: {
    //       reference_id: order.client_order_id,
    //     },
    //   });
    //   orderId = newOrder.id;
    // }
    for (const detail of order.procurement_order_details) {
      const sortItem = await database.scmProd.scm_order_details.findFirst({
        where: {
          reference_order_id: order.client_order_id,
          reference_id: detail.reference_id,
        },
      });
      if (!sortItem) {
        console.log(`sort item ${detail.reference_id} not found`);
        // await database.scmProd.scm_order_details.create({
        //   data: {
        //     reference_order_id: order.client_order_id,
        //     reference_id: detail.reference_id,
        //     num: detail.order_qty?.toString() ?? '0',
        //     price: detail.price,
        //   },
        // });
      }
    }
  }
};

run();
