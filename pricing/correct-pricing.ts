import { PrismaClient as IMProcurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as Scm } from '../prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from '../prisma/clients/scm-pricing-prod';

const run = async () => {
  const imProcurement = new IMProcurement();
  const scm = new Scm();
  const scmPricing = new ScmPricing();

  const goods = await scmPricing.scm_goods.findMany();
  const length = goods.length;
  let i = 0;

  for (const good of goods) {
    i++;
    if (i % 1000 === 0) {
      console.log(`${i}/${length}`);
    }

    const pricings = await scmPricing.scm_good_pricing.findMany({
      where: {
        goods_id: good.id,
        version: '20250720',
      },
    });

    for (const item of pricings) {
      if (item.pricing_strategy === 'margin') {
        const correctPrice =
          Math.round(
            Number(good.price) * (1 + Number(item.profit_margin) / 100) * 100
          ) / 100;

        if (Number(correctPrice) !== Number(item.sale_price)) {
          await scmPricing.scm_good_pricing.update({
            where: {
              id: item.id,
            },
            data: {
              sale_price: correctPrice,
            },
          });
        }
      }
    }
  }
};

run();
