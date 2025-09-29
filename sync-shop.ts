import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const pCities = await database.imBasicProd.cities.findMany();
  const pShops = await database.imBasicProd.scm_shop.findMany();

  for (const pCity of pCities) {
    await database.imAccountingProd.cities.upsert({
      where: {
        id: pCity.id,
      },
      update: {
        ...pCity,
      },
      create: {
        ...pCity,
      },
    });
  }

  for (const pShop of pShops) {
    await database.imAccountingProd.scm_shop.upsert({
      where: {
        id: pShop.id,
      },
      update: {
        ...(pShop as any),
      },
      create: {
        ...(pShop as any),
      },
    });
  }
};

run();
