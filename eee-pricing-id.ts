import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const details =
    await database.scmOrderProd.procurement_order_details.findMany({
      where: {
        pricing_id: null,
      },
    });

  console.log(details.length);
  for (const detail of details) {
    const pricing = await database.scmPricingProd.scm_good_pricing.findFirst({
      where: {
        external_reference_id: detail.reference_id,
      },
    });
    if (pricing) {
      await database.scmOrderProd.procurement_order_details.update({
        where: {
          id: detail.id,
        },
        data: {
          pricing_id: pricing.id,
        },
      });
    }
  }
};

run();
