import { PrismaClient as ScmPricingDb } from './prisma/clients/scm-pricing-prod';
import { PrismaClient as ScmOrderDb } from './prisma/clients/scm-order-prod';

const run = async () => {
  const pricingDb = new ScmPricingDb();
  const orderDb = new ScmOrderDb();

  const details = await orderDb.procurement_order_details.findMany({
    where: {
      weighted_average_cost: null,
    },
  });

  console.log(details.length);

  for (const detail of details) {
    const price = await pricingDb.scm_good_pricing.findFirst({
      where: {
        external_reference_id: detail.reference_id,
      },
    });

    if (!price) {
      console.log(`No price found for ${detail.reference_id}`);
      continue;
    }

    await orderDb.procurement_order_details.update({
      where: {
        id: detail.id,
      },
      data: {
        weighted_average_cost: price.weighted_average_cost,
      },
    });
  }
};

run();
