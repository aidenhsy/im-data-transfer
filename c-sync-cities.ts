import { PrismaClient as IMProd } from './prisma/clients/im-prod';
import { PrismaClient as SCMProd } from './prisma/clients/scm-prod';
import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement';

const run = async () => {
  const imProd = new IMProd();
  const imProcurement = new IMProcurement();

  const prodShops = await imProd.scm_shop.findMany();

  for (const shop of prodShops) {
    const { supply_plan_id, client_tier_id, ...rest } = shop;
    await imProcurement.scm_shop.upsert({
      update: {
        city_id: shop.city_id,
        is_enabled: shop.is_enabled,
        status: shop.status,
      },
      where: {
        id: shop.id,
      },
      create: rest,
    });
  }

  await imProcurement.brand_cities.deleteMany();

  const brand_cities = await imProcurement.scm_shop.findMany({
    distinct: ['brand_id', 'city_id'],
    where: {
      is_enabled: true,
    },
  });

  await imProcurement.brand_cities.createMany({
    data: brand_cities.map((bc) => ({
      brand_id: bc.brand_id,
      city_id: bc.city_id,
    })),
  });
};

run();
