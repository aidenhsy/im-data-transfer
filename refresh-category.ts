import { PrismaClient as SCMOrderProdClient } from './prisma/clients/scm-order-prod';
import { PrismaClient as ScmPricingProdClient } from './prisma/clients/scm-pricing-prod';
import { PrismaClient as ScmProdClient } from './prisma/clients/scm-prod';

const run = async () => {
  const scmOrderProd = new SCMOrderProdClient();
  const scmPricingProd = new ScmPricingProdClient();
  const scmProd = new ScmProdClient();

  const categories = await scmProd.scm_goods_category.findMany();

  for (const category of categories) {
    await scmPricingProd.scm_goods_category.upsert({
      where: {
        id: category.id,
      },
      update: {
        ...category,
      },
      create: {
        ...category,
      },
    });

    await scmOrderProd.scm_goods_category.upsert({
      where: {
        id: category.id,
      },
      update: {
        ...category,
      },
      create: {
        ...category,
      },
    });
  }
};

run();
