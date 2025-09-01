import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.imProcurementProd.supplier_orders.findMany({
    where: {
      receive_time: null,
      status: {
        in: [4, 5],
      },
    },
  });
  for (const order of orders) {
    const bOrder = await database.scmProd.scm_order_details.findFirst({
      where: {
        reference_order_id: order.id,
      },
      select: {
        scm_order: {
          select: {
            arrival_time: true,
            delivery_time: true,
          },
        },
      },
    });

    if (!bOrder) {
      console.log(order.id, 'not found');
      continue;
    }
    if (bOrder.scm_order.delivery_time === null) {
      console.log(order.id, 'delivery_time is null');
      continue;
    }
    await database.imProcurementProd.supplier_orders.update({
      where: {
        id: order.id,
      },
      data: {
        receive_time: bOrder.scm_order.delivery_time,
      },
    });

    await database.scmOrderProd.procurement_orders.update({
      where: {
        client_order_id: order.id,
      },
      data: {
        customer_receive_time: bOrder.scm_order.delivery_time,
      },
    });
  }
};

run();
