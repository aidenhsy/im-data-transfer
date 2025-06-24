import { PrismaClient as IMProd } from './prisma/clients/im-prod';
import { PrismaClient as SCMProd } from './prisma/clients/scm-prod';
import { PrismaClient as SCMPricing } from './prisma/clients/scm-pricing';

const run = async () => {
  const scm = new SCMProd();
  const scmPricing = new SCMPricing();

  const VERSION = '20250624';
  const LOCKED_AFTER_DATE = new Date('2025-06-24T03:30:00.000Z');

  const scmGoodPricings = await scm.scm_good_pricing.findMany({
    include: {
      scm_good_units: true,
      scm_goods: true,
    },
  });

  console.log('Total scmGoodPricings', scmGoodPricings.length);

  for (const prod of scmGoodPricings) {
    const existGoods = await scmPricing.scm_goods.findFirst({
      where: {
        id: prod.goods_id,
      },
    });
    if (!existGoods) {
      await scmPricing.scm_goods.create({
        data: prod.scm_goods,
      });
    }
    const existUnit = await scmPricing.scm_good_units.findFirst({
      where: {
        id: prod.good_unit_id,
      },
    });
    if (!existUnit) {
      await scmPricing.scm_good_units.create({
        data: prod.scm_good_units,
      });
    }

    await scmPricing.scm_good_pricing.create({
      data: {
        client_tier_id: prod.client_tier_id,
        profit_margin: prod.profit_margin,
        sale_price: prod.sale_price,
        is_active: prod.is_active,
        city_id: 1,
        cut_off_time: prod.cut_off_time,
        goods_id: prod.goods_id,
        good_unit_id: prod.good_unit_id,
        pricing_strategy: prod.pricing_strategy,
        version: VERSION,
        locked_after: LOCKED_AFTER_DATE,
      },
    });
  }

  const devPricings = await scmPricing.scm_good_pricing.count({
    where: {
      version: VERSION,
    },
  });

  console.log('Total devPricings', devPricings);
};

run();
