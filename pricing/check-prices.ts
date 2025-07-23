import { PrismaClient as IMProcurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as Scm } from '../prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from '../prisma/clients/scm-pricing-prod';

const run = async () => {
  const imProcurement = new IMProcurement();
  const scm = new Scm();
  const scmPricing = new ScmPricing();

  const goods = await scm.scm_goods.findMany();
  const length = goods.length;
  let i = 0;

  for (const good of goods) {
    i++;
    if (i % 1000 === 0) {
      console.log(`${i}/${length}`);
    }
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
        `${good.id} ${good.name} ${good.price} ${pricing?.price} not good price `
      );
    }

    const pricings = await scmPricing.scm_good_pricing.findMany({
      where: {
        goods_id: good.id,
        version: '20250723',
      },
    });

    for (const item of pricings) {
      if (item.pricing_strategy === 'margin') {
        const correctPrice =
          Math.round(
            Number(good.price) * (1 + Number(item.profit_margin) / 100) * 100
          ) / 100;

        if (Number(correctPrice) !== Number(item.sale_price)) {
          console.log(
            `${good.id} ${good.name} ${correctPrice} ${item.sale_price} not margin price equal`
          );
        }
      }
    }
  }
};

run();
