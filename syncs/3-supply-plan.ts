import { PrismaClient as IMProcurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as IMBasicData } from '../prisma/clients/im-basic-data-prod';

const run = async () => {
  const imProcurement = new IMProcurement();
  const imBasicData = new IMBasicData();

  const supplyPlan = await imProcurement.scm_supply_plan.findMany();

  await imBasicData.supply_plan_items.deleteMany();
  for (const plan of supplyPlan) {
    await imBasicData.scm_supply_plan.upsert({
      where: { id: plan.id },
      update: { ...plan },
      create: { ...plan },
    });
  }

  const supplyPlanItems = await imProcurement.supply_plan_items.findMany();

  for (const item of supplyPlanItems) {
    await imBasicData.supply_plan_items.upsert({
      where: { id: item.id },
      update: { ...item },
      create: { ...item },
    });
  }
};

run();
