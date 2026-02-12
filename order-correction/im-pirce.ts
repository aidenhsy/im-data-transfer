import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.imProcurementProd.supplier_orders.findMany({
    where: {
      delivery_time: {
        gte: new Date('2026-01-01T00:00:00'),
      },
      status: 4,
    },
    select: {
      id: true,
      actual_amount: true,
      supplier_order_details: {
        select: {
          total_final_amount: true,
        },
      },
    },
  });

  for (const order of orders) {
    const actualAmount = order.supplier_order_details.reduce(
      (acc, detail) => acc + Number(detail.total_final_amount),
      0
    );
    if (actualAmount !== Number(order.actual_amount)) {
      console.log(order.id, actualAmount, order.actual_amount);
      await database.imProcurementProd.supplier_orders.update({
        where: {
          id: order.id,
        },
        data: {
          actual_amount: actualAmount,
        },
      });
    }
  }
  console.log('done');
};

run();
