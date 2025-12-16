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
    for (const detail of order.procurement_order_details) {
      const sortItem = await database.scmProd.scm_order_details.findFirst({
        where: {
          reference_order_id: order.client_order_id,
          reference_id: detail.reference_id,
        },
      });
      if (!sortItem) {
        console.log(`sort item ${detail.reference_id} not found`);
        continue;
      }

      if (Number(sortItem.deliver_goods_qty) === 0) {
        console.log(
          `update deliver goods qty for sort item ${detail.reference_id}`
        );
      }
      // console.log(
      //   sortItem.deliver_goods_qty,
      //   sortItem.delivery_qty,
      //   detail.deliver_qty
      // );
    }
  }
};

run();
