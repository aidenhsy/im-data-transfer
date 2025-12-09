import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const devShops = await database.scmOrderDev.scm_shop.findMany();

  const shops = await database.scmOrderProd.scm_shop.findMany();
  for (const devShop of devShops) {
    console.log(`Syncing shop ${devShop.id}`);
    const shop = shops.find((shop) => shop.id === devShop.id);
    if (!shop) {
      console.log(`Shop ${devShop.id} not found in prod shops`);
      continue;
    }
    await database.scmOrderDev.scm_shop.update({
      where: {
        id: devShop.id,
      },
      data: {
        ...shop,
      },
    });
  }
};

run();
