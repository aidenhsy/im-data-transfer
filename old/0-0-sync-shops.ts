import { PrismaClient as IM } from '../prisma/clients/im-prod';
import { PrismaClient as IMProcurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as Scm } from '../prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from '../prisma/clients/scm-pricing-prod';
import { PrismaClient as IMBasic } from '../prisma/clients/im-basic-data-prod';

const run = async () => {
  const im = new IM();
  const scm = new Scm();
  const imProcurement = new IMProcurement();
  const imBasic = new IMBasic();
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

    await imBasic.scm_shop.upsert({
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
        automatic_receiving: shop.automatic_receiving,
        sales_plan_id: shop.sales_plan_id,
        big_org_id: shop.organization_id,
        open_hours: [
          {
            weekday: '星期一',
            open_hour: '09:00',
            close_hour: '21:00',
            day_of_week: 1,
          },
          {
            weekday: '星期二',
            open_hour: '09:00',
            close_hour: '21:00',
            day_of_week: 2,
          },
          {
            weekday: '星期三',
            open_hour: '09:00',
            close_hour: '21:00',
            day_of_week: 3,
          },
          {
            weekday: '星期四',
            open_hour: '09:00',
            close_hour: '21:00',
            day_of_week: 4,
          },
          {
            weekday: '星期五',
            open_hour: '09:00',
            close_hour: '21:00',
            day_of_week: 5,
          },
          {
            weekday: '星期六',
            open_hour: '09:00',
            close_hour: '21:00',
            day_of_week: 6,
          },
          {
            weekday: '星期日',
            open_hour: '09:00',
            close_hour: '21:00',
            day_of_week: 7,
          },
        ],
      },
    });
  }
};

run();
