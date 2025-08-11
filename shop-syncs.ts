import { PrismaClient as SCMOrderProd } from './prisma/clients/scm-order-prod';
import { PrismaClient as SCMProd } from './prisma/clients/scm-prod';
import { PrismaClient as ProcurementProd } from './prisma/clients/im-procurement-prod';
import { PrismaClient as ImProd } from './prisma/clients/im-prod';
import { PrismaClient as ImBasicDataProd } from './prisma/clients/im-basic-data-prod';

const run = async () => {
  const scmOrderProd = new SCMOrderProd();
  const scmProd = new SCMProd();
  const procurementProd = new ProcurementProd();
  const imProd = new ImProd();
  const imBasicDataProd = new ImBasicDataProd();

  const shops = await scmProd.scm_shop.findMany();

  for (const shopItem of shops) {
    const {
      ingredient_type_id,
      client_organization_id,
      organization_id,
      client_tier_id,
      business_id,
      ...shop
    } = shopItem;
    await scmOrderProd.scm_shop.upsert({
      where: {
        id: shop.id,
      },
      create: {
        ...shop,
        client_organization_id: client_organization_id,
        organization_id: organization_id,
        client_tier_id: client_tier_id,
        business_id: 0,
      },
      update: {
        ...shop,
        client_organization_id: client_organization_id,
        organization_id: organization_id,
        client_tier_id: client_tier_id,
      },
    });
    console.log(organization_id);
    await procurementProd.scm_shop.upsert({
      where: {
        id: shop.id,
      },
      create: {
        ...shop,
        big_org_id: organization_id,
        business_id: 0,
        client_tier_id: client_tier_id,
      },
      update: {
        ...shop,
        big_org_id: organization_id,
        client_tier_id: client_tier_id,
      },
    });
    await imProd.scm_shop.upsert({
      where: {
        id: shop.id,
      },
      create: {
        ...shop,
        big_org_id: organization_id,
        client_tier_id: client_tier_id,
        business_id: 0,
      },
      update: {
        ...shop,
        big_org_id: organization_id,
      },
    });
    await imBasicDataProd.scm_shop.upsert({
      where: {
        id: shop.id,
      },
      create: {
        ...shop,
        big_org_id: client_organization_id,
        business_id: 0,
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
      update: {
        ...shop,
        big_org_id: client_organization_id,
      },
    });
  }
};

run();
