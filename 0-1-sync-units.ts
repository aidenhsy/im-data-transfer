import { PrismaClient as IMProd } from './prisma/clients/im-prod';
import { PrismaClient as SCMProd } from './prisma/clients/scm-prod';
import { PrismaClient as SCMPricingProd } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const scm = new SCMProd();
  const im = new IMProd();
  const scmPricing = new SCMPricingProd();

  const scmGoods = await scm.scm_goods.findMany();

  for (const good of scmGoods) {
    await scmPricing.scm_goods.upsert({
      where: {
        id: good.id,
      },
      update: {
        ...good,
      },
      create: {
        ...good,
      },
    });
  }

  const scm_good_units = await scm.scm_good_units.findMany();

  for (const unit of scm_good_units) {
    await im.scm_good_units.upsert({
      where: {
        id: unit.id,
      },
      update: {
        ...unit,
      },
      create: {
        ...unit,
      },
    });
  }
};

run();
