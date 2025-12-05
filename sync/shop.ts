import { DatabaseService } from './../database';

const run = async () => {
  const database = new DatabaseService();

  const basicShops = await database.scmProd.scm_shop.findMany({
    orderBy: {
      id: 'asc',
    },
  });

  const orderShops = await database.scmOrderProd.scm_shop.findMany({
    orderBy: {
      id: 'asc',
    },
  });

  for (const basicShop of basicShops) {
    const orderShop = orderShops.find((shop) => shop.id === basicShop.id);
    if (!orderShop) {
      console.log(`Shop ${basicShop.id} not found in order shops`);
      continue;
    }

    const areEqual = JSON.stringify(orderShop) === JSON.stringify(basicShop);
    console.log(areEqual);
    if (!areEqual) {
      console.log(`Shop ${basicShop.id} is not equal to order shop`);
      await database.scmOrderProd.scm_shop.upsert({
        where: {
          id: basicShop.id,
        },
        update: {
          ...basicShop,
        },
        create: {
          ...basicShop,
        },
      });
    }
  }
};

run();
