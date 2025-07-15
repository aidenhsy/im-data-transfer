import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const imProcurement = new IMProcurement();
  const scm = new Scm();
  const scmPricing = new ScmPricing();

  const goods = await scm.scm_goods.findMany();

  for (const good of goods) {
    const pricing = await scmPricing.scm_goods.findFirst({
      where: {
        id: good.id,
      },
    });
    if (!pricing) {
      console.log(`${good.id} ${good.name} not found`);
    }
    if (Number(good.price) !== Number(pricing?.price)) {
      console.log(
        `${good.id} ${good.name} ${good.price} ${pricing?.price} not equal`
      );
    }

    const pricings = await scmPricing.scm_good_pricing.findMany({
      where: {
        goods_id: good.id,
      },
    });

    for (const item of pricings) {
      if (item.pricing_strategy === 'margin') {
        const correctPrice =
          Math.round(
            Number(good.price) * (1 + Number(item.profit_margin) / 100) * 100
          ) / 100;

        const currentPrice = Math.round(Number(item.sale_price) * 100) / 100;

        if (Number(correctPrice) !== Number(currentPrice)) {
          console.log(
            `${good.id} ${good.name} ${correctPrice} ${currentPrice} not equal`
          );
        }
      }
    }
  }
};

run();
