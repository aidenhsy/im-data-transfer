import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const pricings = await database.imProcurementProd.supplier_items.findMany({
    select: {
      supplier_reference_id: true,
      price: true,
    },
  });

  for (const pricing of pricings) {
    const matchPricing =
      await database.scmPricingProd.scm_good_pricing.findFirst({
        where: {
          external_reference_id: pricing.supplier_reference_id,
        },
      });
    if (!matchPricing) {
      continue;
    }

    if (Number(matchPricing.sale_price) !== Number(pricing.price)) {
      console.log(
        pricing.supplier_reference_id,
        matchPricing.sale_price,
        pricing.price
      );
    }
  }
};

run();
