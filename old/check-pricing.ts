import { PrismaClient as ScmPricing } from '../prisma/clients/scm-pricing-prod';
import { PrismaClient as Scm } from '../prisma/clients/scm-prod';
import { PrismaClient as IM } from '../prisma/clients/im-prod';
import { PrismaClient as IMProcurement } from '../prisma/clients/im-procurement-prod';

const run = async () => {
  const scmPricing = new ScmPricing();
  const imProcurement = new IMProcurement();

  const supplierItems = await imProcurement.supplier_items.findMany();

  for (const supplierItem of supplierItems) {
    const pricing = await scmPricing.scm_good_pricing.findFirst({
      where: {
        external_reference_id: supplierItem.supplier_reference_id,
      },
    });

    if (!pricing) {
      console.log('!!!  not found', supplierItem.supplier_reference_id);
    }

    if (Number(pricing?.sale_price) !== Number(supplierItem.price)) {
      console.log(
        '!!!  price mismatch',
        supplierItem.supplier_reference_id,
        pricing?.sale_price,
        supplierItem.price
      );
    }
  }
};
