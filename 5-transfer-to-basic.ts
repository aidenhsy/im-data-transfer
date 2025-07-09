import { PrismaClient as ImBasicDataProdClient } from './prisma/clients/im-basic-data-prod';
import { PrismaClient as ImProcurementProdClient } from './prisma/clients/im-procurement-prod';

const run = async () => {
  const imBasicDataProd = new ImBasicDataProdClient();
  const imProcurementProd = new ImProcurementProdClient();

  const shops = await imProcurementProd.scm_shop.findMany();

  for (const shop of shops) {
    const { client_tier_id, ...rest } = shop;
    await imBasicDataProd.scm_shop.upsert({
      where: {
        id: shop.id,
      },
      create: {
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
        ...rest,
      },
      update: {
        ...rest,
      },
    });
  }

  const genericItems = await imProcurementProd.generic_items.findMany();

  for (const genericItem of genericItems) {
    await imBasicDataProd.generic_items.upsert({
      where: {
        id: genericItem.id,
      },
      create: {
        ...genericItem,
      },
      update: {
        ...genericItem,
      },
    });
  }

  const supplyPlans = await imProcurementProd.scm_supply_plan.findMany();

  for (const supplyPlan of supplyPlans) {
    await imBasicDataProd.scm_supply_plan.upsert({
      where: {
        id: supplyPlan.id,
      },
      create: {
        ...supplyPlan,
      },
      update: {
        ...supplyPlan,
      },
    });
  }

  const supplyPlanItems = await imProcurementProd.supply_plan_items.findMany();

  await imBasicDataProd.supply_plan_items.deleteMany();
  for (const supplyPlanItem of supplyPlanItems) {
    await imBasicDataProd.supply_plan_items.create({
      data: {
        ...supplyPlanItem,
      },
    });
  }
};

run();
