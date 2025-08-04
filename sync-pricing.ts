import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const scmPricing = new ScmPricing();

  const pricings = await scmPricing.scm_good_pricing.findMany();

  for (const pricing of pricings) {
    const baseCost = Number(
      (
        Number(pricing.sale_price) /
        (1 + Number(pricing.profit_margin) / 100)
      ).toFixed(4)
    );

    if (
      Math.abs(Number(pricing.weighted_average_cost) - Number(baseCost)) > 0.01
    ) {
      console.log(pricing.weighted_average_cost, baseCost);
    }
  }
};

run();
