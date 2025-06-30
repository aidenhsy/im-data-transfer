import { PrismaClient as ImDevBasicData } from './prisma/clients/im-dev-basic-data';
import { PrismaClient as ImProcurement } from './prisma/clients/im-procurement';

const run = async () => {
  const imDevBasicData = new ImDevBasicData();
  const imProcurement = new ImProcurement();

  const supplyPlans = await imProcurement.scm_supply_plan.findMany();
  const genericItems = await imProcurement.generic_items.findMany();

  for (const genericItem of genericItems) {
    await imDevBasicData.generic_items.upsert({
      where: {
        id: genericItem.id,
      },
      update: genericItem,
      create: genericItem,
    });
  }

  for (const supplyPlan of supplyPlans) {
    await imDevBasicData.scm_supply_plan.upsert({
      where: {
        id: supplyPlan.id,
      },
      update: supplyPlan,
      create: supplyPlan,
    });
  }

  const planItems = await imProcurement.supply_plan_items.findMany();
  const length = planItems.length;
  let index = 0;

  for (const planItem of planItems) {
    index++;
    console.log(`${index}/${length}`);
    await imDevBasicData.supply_plan_items.create({
      data: planItem,
    });
  }
};

run();
