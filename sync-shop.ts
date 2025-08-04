import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';
import { PrismaClient as Pricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const procurement = new Procurement();
  const order = new Order();

  const pCities = await procurement.cities.findMany();
  const pShops = await procurement.scm_shop.findMany();

  for (const pCity of pCities) {
    await order.cities.upsert({
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
    const { big_org_id, shop_pic_url, ...rest } = pShop;
    await order.scm_shop.upsert({
      where: {
        id: pShop.id,
      },
      update: {
        ...rest,
        organization_id: 1,
        business_id: 0,
      },
      create: {
        ...rest,
        organization_id: 1,
        business_id: 0,
      },
    });
  }
};

run();
