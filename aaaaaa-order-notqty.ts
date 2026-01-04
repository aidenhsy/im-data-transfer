import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orderItems =
    await database.scmOrderProd.procurement_order_details.findMany({
      where: {
        procurement_orders: {
          status: 3,
        },
        deliver_qty: null,
      },
      include: {
        procurement_orders: true,
      },
    });

  console.log(orderItems.length);

  for (const orderItem of orderItems) {
    const scmitem = await database.scmProd.scm_order_details.findFirst({
      where: {
        reference_id: orderItem.reference_id,
        reference_order_id: orderItem.procurement_orders.client_order_id,
      },
    });

    await database.scmOrderProd.procurement_order_details.update({
      where: {
        id: orderItem.id,
      },
      data: {
        deliver_qty: scmitem?.deliver_goods_qty,
        customer_receive_qty: scmitem?.deliver_goods_qty,
        final_qty: scmitem?.deliver_goods_qty,
      },
    });
  }
};

run();
