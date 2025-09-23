import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.scmOrderProd.procurement_orders.findMany({
    where: {
      shop_id: {
        not: 148,
      },
    },
    select: {
      id: true,
      client_order_id: true,
      created_at: true,
      status: true,
    },
  });

  const imOrders = await database.imProcurementProd.supplier_orders.findMany({
    select: {
      id: true,
    },
  });

  const missingImOrders = orders.filter(
    (order) => !imOrders.some((imOrder) => imOrder.id === order.client_order_id)
  );

  await database.scmOrderProd.procurement_order_details.deleteMany({
    where: {
      order_id: {
        in: missingImOrders.map((order) => order.id),
      },
    },
  });
  await database.scmOrderProd.procurement_order_status_history.deleteMany({
    where: {
      order_id: {
        in: missingImOrders.map((order) => order.id),
      },
    },
  });

  await database.scmOrderProd.procurement_orders.deleteMany({
    where: {
      id: {
        in: missingImOrders.map((order) => order.id),
      },
    },
  });

  // const missingOrders = await database.scmOrderProd.procurement_orders.findMany(
  //   {
  //     where: {
  //       client_order_id: {
  //         in: missingImOrders.map((order) => order.client_order_id),
  //       },
  //     },
  //     include: {
  //       procurement_order_details: true,
  //     },
  //   }
  // );

  // for (const order of missingOrders) {
  //   await database.imProcurementProd.supplier_orders.create({
  //     data: {
  //       id: order.client_order_id,
  //       shop_id: order.shop_id,
  //       supplier_id: 1,
  //       irregular_items: 0,
  //       status: 0,
  //       order_date: order.order_date!,
  //       delivery_date: order.delivery_date!,
  //       type: order.type,
  //       created_at: order.created_at!,
  //       updated_at: order.updated_at!,
  //       delivery_time: order.delivery_time,
  //       order_amount: order.order_amount,
  //       actual_amount: order.actual_amount,
  //       receive_time: order.customer_receive_time,
  //       sent_time: order.sent_time,
  //       estimated_delivery_time: order.estimated_delivery_time,
  //     },
  //   });
  // }
};

run();
