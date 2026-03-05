import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  try {
    const orders = await database.imProcurementProd.supplier_orders.findMany({
      where: {
        created_at: {
          gt: new Date('2026-03-01T00:00:00Z'),
        },
      },
      include: {
        supplier_order_details: true,
      },
    });

    for (const order of orders) {
      console.log(order.id);
      const isReceived = order.status === 4;

      await Promise.all(
        order.supplier_order_details.map((detail) => {
          const totalOrderAmount = Number(
            (Number(detail.order_qty) * Number(detail.price)).toFixed(2),
          );
          const totalDeliveryAmount = Number(
            (Number(detail.actual_delivery_qty) * Number(detail.price)).toFixed(2),
          );
          const totalFinalAmount = Number(
            (Number(detail.final_qty) * Number(detail.price)).toFixed(2),
          );

          return database.imProcurementProd.supplier_order_details.update({
            where: { id: detail.id },
            data: {
              total_order_amount: totalOrderAmount,
              ...(isReceived && {
                total_delivery_amount: totalDeliveryAmount,
                total_final_amount: totalFinalAmount,
              }),
            },
          });
        }),
      );

      const orderAmount = order.supplier_order_details.reduce(
        (acc, detail) =>
          acc + Number((Number(detail.order_qty) * Number(detail.price)).toFixed(2)),
        0,
      );
      const actualAmount = order.supplier_order_details.reduce(
        (acc, detail) =>
          acc + Number((Number(detail.actual_delivery_qty) * Number(detail.price)).toFixed(2)),
        0,
      );

      await database.imProcurementProd.supplier_orders.update({
        where: { id: order.id },
        data: {
          order_amount: orderAmount,
          ...(isReceived && { actual_amount: actualAmount }),
        },
      });
    }
  } finally {
    await database.disconnect();
  }
};

run();