import { PrismaClient as ScmPricing } from '../prisma/clients/scm-pricing-prod';

const run = async () => {
  const scmPricing = new ScmPricing();

  const data = await scmPricing.scm_good_pricing.findMany({
    where: {
      version: '20250719',
      city_id: 15,
    },
  });

  for (const item of data) {
    const { city_id, external_reference_id, id, ...rest } = item;
    await scmPricing.scm_good_pricing.create({
      data: {
        ...rest,
        city_id: 19,
      },
    });
  }
};

run();
