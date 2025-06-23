import { PrismaClient as IMProd } from './prisma/clients/im-prod';
import { PrismaClient as SCMProd } from './prisma/clients/scm-prod';
import { PrismaClient as SCMPricing } from './prisma/clients/scm-pricing';
import { PrismaClient as ImProcurement } from './prisma/clients/im-procurement';

const run = async () => {
  const im = new IMProd();
  const imProcurement = new ImProcurement();

  const supplyPlans = await im.scm_supply_plan.findMany({
    where: {
      id: {
        gt: 71,
      },
    },
  });

  for (const sp of supplyPlans) {
    await imProcurement.scm_supply_plan.create({
      data: {
        id: sp.id,
        name: sp.name,
        serial_num: sp.serial_num,
        organization_id: sp.organization_id,
      },
    });
  }
};

run();
