import { PrismaClient as IMProcurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as ScmPricing } from '../prisma/clients/scm-pricing-prod';

const run = async () => {
  const imProcurement = new IMProcurement();
  const scmPricing = new ScmPricing();

  const thisVersionPricings = await scmPricing.scm_good_pricing.findMany({
    where: {
      version: '20250719',
    },
  });

  const data = await imProcurement.supplier_items.findMany({
    where: {
      supplier_reference_id: {
        notIn: thisVersionPricings.map((item) => item.external_reference_id!),
      },
    },
  });

  const supplierIds = data.map((item) => item.id);

  await imProcurement.plan_item_supplier_good.deleteMany({
    where: {
      supplier_item_id: {
        in: supplierIds,
      },
    },
  });
  await imProcurement.supplier_items.deleteMany({
    where: {
      id: {
        in: supplierIds,
      },
    },
  });
};

run();
