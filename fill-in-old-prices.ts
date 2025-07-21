import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const scmPricing = new ScmPricing();

  const pricings = await scmPricing.scm_good_pricing.findMany();

  for (const pricing of pricings) {
    // Calculate cost price from sale_price and profit_margin (margin as percent, e.g., 10 for 10%)
    const rawCostPrice =
      pricing.sale_price != null && pricing.profit_margin != null
        ? Number(pricing.profit_margin) === 0
          ? Number(pricing.sale_price)
          : Number(pricing.sale_price) /
            (1 + Number(pricing.profit_margin) / 100)
        : null;

    // Round to 2 decimal places accurately
    const costPrice =
      rawCostPrice !== null ? Math.round(rawCostPrice * 100) / 100 : null;

    await scmPricing.scm_good_pricing.update({
      where: { id: pricing.id },
      data: {
        weighted_average_cost: costPrice,
      },
    });
  }

  console.log('Done');
  process.exit(0);
};

run();
