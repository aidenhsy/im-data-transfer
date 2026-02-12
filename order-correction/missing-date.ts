import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.imProcurementProd.supplier_orders.findMany({
    where: {
      status: 4,
      receive_time: null,
    },
    include: {
      supplier_order_details: true,
    },
  });

  console.log(orders.length);

  for (const order of orders) {
    console.log(order.id);
    const scmOrder = await database.scmProd.scm_order.findFirst({
      where: {
        reference_id: order.id,
      },
    });
    if (!scmOrder) {
      const detail = await database.scmProd.scm_order_details.findFirst({
        where: {
          reference_order_id: order.id,
        },
        include: {
          scm_order: true,
        },
      });
      await database.scmProd.scm_order.update({
        where: {
          id: detail?.scm_order?.id,
        },
        data: {
          reference_id: order.id,
        },
      });
      continue;
    }
    if (!scmOrder?.delivery_time) {
      console.log('delivery time not found', order.id);
      continue;
    }
    const deliveryAmount = order.supplier_order_details.reduce(
      (acc, detail) => acc + Number(detail.total_delivery_amount),
      0
    );

    const finalAmount = order.supplier_order_details.reduce(
      (acc, detail) => acc + Number(detail.total_final_amount),
      0
    );

    await database.imProcurementProd.supplier_orders.update({
      where: {
        id: order.id,
      },
      data: {
        receive_time: scmOrder.delivery_time,
        sent_time: scmOrder.delivery_time,
        delivery_time: scmOrder.delivery_time,
        actual_amount: finalAmount,
      },
    });

    await database.scmOrderProd.procurement_orders.update({
      where: {
        client_order_id: order.id,
      },
      data: {
        delivery_time: scmOrder.delivery_time,
        sent_time: scmOrder.delivery_time,
        customer_receive_time: scmOrder.delivery_time,
        actual_amount: finalAmount,
      },
    });

    console.log('updated order', order.id);
  }
};

run();
