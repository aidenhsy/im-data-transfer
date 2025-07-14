import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as IM } from './prisma/clients/im-prod';
import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';

const run = async () => {
  const scmPricing = new ScmPricing();
  const imProcurement = new IMProcurement();

  const pricings = await scmPricing.scm_good_pricing.findMany({
    where: {
      pricing_strategy: 'margin',
      version: '20250714',
    },
  });

  for (const pricing of pricings) {
    const good = await scmPricing.scm_goods.findUnique({
      where: {
        id: pricing.goods_id,
      },
    });

    const newPricing = await scmPricing.scm_good_pricing.update({
      where: {
        id: pricing.id,
      },
      data: {
        sale_price:
          Math.round(
            Number(good?.price) *
              (1 + Number(pricing.profit_margin) / 100) *
              100
          ) / 100,
      },
    });

    const supplierItem = await imProcurement.supplier_items.findFirst({
      where: {
        supplier_reference_id: pricing.external_reference_id,
      },
    });

    if (!supplierItem) {
      console.log(good?.name);
    }

    await imProcurement.supplier_items.update({
      where: {
        id: supplierItem?.id,
      },
      data: {
        price: newPricing.sale_price,
      },
    });
  }
};
run();
