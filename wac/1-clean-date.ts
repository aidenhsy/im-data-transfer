import { PrismaClient as ImInventory } from '../prisma/clients/im-inventory-prod';

const run = async () => {
  const imInventory = new ImInventory();
  const counts = await imInventory.inventory_count.findMany({
    where: {
      created_at: {
        gt: new Date('2025-07-30'),
      },
    },
  });

  for (const count of counts) {
    await imInventory.inventory_count.update({
      where: {
        id: count.id,
      },
      data: {
        created_at: new Date('2025-07-31T21:00:00.000Z'),
      },
    });
  }
};

run();
