import { PrismaClient as ImProcurementDB } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as ScmPricingDB } from '../prisma/clients/scm-pricing-prod';

const run = async () => {
  const imProcurementDB = new ImProcurementDB();
  const scmPricingDB = new ScmPricingDB();

  const pricings = await scmPricingDB.scm_good_pricing.findMany({
    where: {
      version: '20250718',
    },
  });
  console.log(pricings.length);

  for (const pricing of pricings) {
    const existSupplierItem = await imProcurementDB.supplier_items.findFirst({
      where: {
        supplier_reference_id: pricing.external_reference_id,
      },
    });

    if (!existSupplierItem) {
      console.log(pricing.external_reference_id);
    }
  }
};

run();
