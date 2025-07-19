import { PrismaClient as IMProcurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as ScmPricing } from '../prisma/clients/scm-pricing-prod';

const run = async () => {
  const imProcurement = new IMProcurement();
  const scmPricing = new ScmPricing();

  const data = await imProcurement.supplier_items.findMany();

  for (const item of data) {
    const pricing = await scmPricing.scm_good_pricing.findFirst({
      where: {
        external_reference_id: item.supplier_reference_id,
      },
      include: {
        scm_goods: true,
      },
    });

    if (!pricing) {
      console.log(item.supplier_reference_id, 'No pricing');
    }

    if (pricing?.scm_goods.name !== item.name) {
      console.log('pricing name: ', pricing?.scm_goods.name);
      console.log('item name: ', item.name);
    }

    if (pricing?.is_active === false && item.status === 1) {
      console.log(item.supplier_reference_id, 'Inactive pricing');
    }
  }
};

run();
