import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.imProcurementProd.supplier_orders.findMany({
    where: {
      created_at: {
        gte: new Date('2025-12-06 00:00:00'),
      },
      type: 3,
    },
    select: {
      id: true,
      supplier_order_details: {
        select: {
          order_id: true,
          supplier_reference_id: true,
        },
      },
    },
  });

  for (const order of orders) {
    const scmOrderDetails = await database.scmProd.scm_order_details.findMany({
      where: {
        reference_order_id: order.id,
      },
    });

    console.log(order.supplier_order_details.length, scmOrderDetails.length);
  }
};

run();
