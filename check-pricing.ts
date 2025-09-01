import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();
  const supplierItems =
    await database.imProcurementProd.supplier_items.findMany();

  for (const supplierItem of supplierItems) {
    const pricing = await database.scmPricingProd.scm_good_pricing.findFirst({
      where: {
        external_reference_id: supplierItem.supplier_reference_id,
      },
    });

    if (pricing?.sale_price !== supplierItem.price) {
      console.log(supplierItem.supplier_reference_id, 'not equal');
    }
  }
};

run();
