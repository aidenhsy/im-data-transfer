import { PrismaClient as ImInventory } from '../prisma/clients/im-inventory-prod';

const run = async () => {
  const imInventory = new ImInventory();

  const orders = await imInventory.supplier_orders.findMany({
    where: {
      status: {
        in: [4, 5],
      },
    },
    include: {
      supplier_order_details: true,
    },
    orderBy: {
      receive_time: 'asc',
    },
    take: 100,
    skip: 0,
  });

  for (const order of orders) {
    for (const detail of order.supplier_order_details) {
    }
  }
};

run();
