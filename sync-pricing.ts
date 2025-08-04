import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const scmPricing = new ScmPricing();

  const pricings = await scmPricing.scm_good_pricing.findMany({
    where: {
      weighted_average_cost: null,
    },
  });

  for (const pricing of pricings) {
    const baseCost =
      Number(pricing.sale_price) / (1 + Number(pricing.profit_margin) / 100);

    await scmPricing.scm_good_pricing.update({
      where: {
        id: pricing.id,
      },
      data: {
        weighted_average_cost: baseCost,
      },
    });
  }
};

run();
