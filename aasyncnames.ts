import { PrismaClient as IM } from './prisma/clients/im-prod';
import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const im = new IM();
  const imProcurement = new IMProcurement();
  const scm = new Scm();
  const scmPricing = new ScmPricing();

  const supplierGoods = await imProcurement.supplier_order_details.findMany();
  const length = supplierGoods.length;

  let i = 0;

  for (const supplierGood of supplierGoods) {
    i++;
    console.log(`${i}/${length}`);
    const pricing = await scmPricing.scm_good_pricing.findFirst({
      where: {
        external_reference_id: supplierGood.supplier_reference_id,
      },
      select: {
        scm_goods: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!pricing) {
      console.log(supplierGood.supplier_reference_id);
      continue;
    }
    await imProcurement.supplier_order_details.update({
      where: { id: supplierGood.id },
      data: {
        supplier_item_name: pricing?.scm_goods?.name,
      },
    });
  }
};

run();
