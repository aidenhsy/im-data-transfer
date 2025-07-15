import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const imProcurement = new IMProcurement();
  const scm = new Scm();
  const scmPricing = new ScmPricing();

  const supplierGoods = await imProcurement.supplier_items.findMany();

  for (const good of supplierGoods) {
    const goodPrice = await scmPricing.scm_good_pricing.findFirst({
      where: {
        external_reference_id: good.supplier_reference_id,
      },
    });

    if (!goodPrice) {
      console.log(`${good.supplier_reference_id} not found`);
    }

    if (Number(good.price) !== Number(goodPrice?.sale_price)) {
      console.log(
        `${good.supplier_reference_id} ${good.price} ${goodPrice?.sale_price} not equal`
      );
    }
  }
};

run();
