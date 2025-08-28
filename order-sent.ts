import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();
  const orders = await database.scmOrderProd.procurement_orders.findMany({
    where: {
      status: 3,
    },
  });
  console.log(orders.length);

  for (const o of orders) {
    const order = await database.scmOrderProd.procurement_orders.findUnique({
      where: {
        id: o.id,
      },
      select: {
        id: true,
        client_order_id: true,
        procurement_order_details: {
          select: {
            reference_id: true,
            id: true,
          },
        },
      },
    });

    if (!order) {
      console.log('Order not found');
      return;
    }
    let arrivalTime: Date | null | string = null;
    for (const detail of order.procurement_order_details) {
      const scmOrder = await database.scmProd.scm_order_details.findFirst({
        where: {
          reference_id: detail.reference_id,
          reference_order_id: order.client_order_id,
        },
        include: {
          scm_order: true,
        },
      });
      if (
        scmOrder?.scm_order.status! < 2 &&
        scmOrder?.scm_order.arrival_time === null
      ) {
        console.log('Order not arrived yet');
        return;
      }

      if (scmOrder?.scm_order.arrival_time) {
        arrivalTime = scmOrder.delivery_time;
      }

      await database.scmOrderProd.procurement_order_details.update({
        where: {
          id: detail.id,
        },
        data: {
          deliver_qty: scmOrder?.delivery_qty,
        },
      });
    }
    await database.scmOrderProd.procurement_orders.update({
      where: {
        id: order.id,
      },
      data: {
        status: 3,
        delivery_time: arrivalTime,
      },
    });
  }
  console.log('Order sent');
};

run();
