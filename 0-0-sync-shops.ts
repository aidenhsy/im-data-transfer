import { PrismaClient as IM } from './prisma/clients/im-prod';
import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';

const run = async () => {
  const im = new IM();
  const imProcurement = new IMProcurement();

  const shops = await im.scm_shop.findMany();

  for (const shop of shops) {
    await imProcurement.scm_shop.upsert({
      where: {
        id: shop.id,
      },
      update: {
        status: shop.status,
        city_id: shop.city_id,
        client_tier_id: shop.client_tier_id,
        automatic_receiving: shop.automatic_receiving,
      },
      create: {
        id: shop.id,
        shop_name: shop.shop_name,
        address: shop.address,
        longitude: shop.longitude,
        latitude: shop.latitude,
        brand_id: shop.brand_id,
        status: shop.status,
        business_id: shop.business_id,
        field: shop.field,
        is_join: shop.is_join,
        city_id: shop.city_id,
        client_tier_id: shop.client_tier_id,
        automatic_receiving: shop.automatic_receiving,
        sales_plan_id: shop.sales_plan_id,
        big_org_id: shop.big_org_id,
      },
    });
  }
};

run();
