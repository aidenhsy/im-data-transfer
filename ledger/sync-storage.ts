import { DatabaseService } from '../database';

const run = async () => {
  const databaseService = new DatabaseService();

  const stockCategories =
    await databaseService.imBasicProd.stock_category.findMany();

  const shops = await databaseService.imBasicProd.scm_shop.findMany({
    where: {
      status: 1,
    },
  });

  for (const shop of shops) {
    for (const stockCategory of stockCategories) {
      await databaseService.imInventoryDev.storage_locations.create({
        data: {
          name: stockCategory.name,
          shop_id: shop.id,
          storage_code: Number(`${shop.id}0000${stockCategory.id}`),
        },
      });
    }
  }
};

run();
