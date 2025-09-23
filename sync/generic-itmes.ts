import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();
  const genericItems = await database.imBasicProd.generic_items.findMany();

  for (const item of genericItems) {
    await database.imInventoryProd.generic_items.upsert({
      where: {
        id: item.id,
      },
      update: {
        ...item,
      },
      create: {
        ...item,
      },
    });
  }
};

run();
