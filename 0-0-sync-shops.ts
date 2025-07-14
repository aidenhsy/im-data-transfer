import { PrismaClient as IM } from './prisma/clients/im-prod';
import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const im = new IM();
  const scm = new Scm();
  const imProcurement = new IMProcurement();
  const scmPricing = new ScmPricing();

  const shops = await scm.scm_shop.findMany();
  const businessDistricts = await scm.scm_business_district.findMany();

  for (const businessDistrict of businessDistricts) {
    await scmPricing.scm_business_district.upsert({
      where: {
        id: businessDistrict.id,
      },
      update: {
        ...businessDistrict,
      },
      create: {
        ...businessDistrict,
      },
    });
  }

  for (const shop of shops) {
    await scmPricing.scm_shop.upsert({
      where: {
        id: shop.id,
      },
      update: {},
      create: {
        ...shop,
      },
    });

    await imProcurement.scm_shop.upsert({
      where: {
        id: shop.id,
      },
      update: {},
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
        big_org_id: shop.organization_id,
      },
    });
  }
};

run();
