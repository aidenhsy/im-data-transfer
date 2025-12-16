import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.scmBackupProd.scm_order.findMany({
    where: {
      estimated_delivery_time: '2025-12-16T09:00:00Z',
      order_type: 1,
    },
    include: {
      scm_order_details: true,
    },
  });

  for (const order of orders) {
    console.log(`copying order ${order.id}`);
    const { scm_order_details, ...rest } = order;
    await database.scmProd.scm_order.create({
      data: {
        ...rest,
      },
    });
    for (const detail of scm_order_details) {
      await database.scmProd.scm_order_details.create({
        data: {
          ...detail,
          order_id: order.id,
        },
      });
    }
  }
};

run();
