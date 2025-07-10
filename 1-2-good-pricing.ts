import { PrismaClient as IMProd } from './prisma/clients/im-prod';
import { PrismaClient as SCMProd } from './prisma/clients/scm-prod';
import { PrismaClient as SCMPricingProd } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const scm = new SCMProd();
  const im = new IMProd();
  const scmPricing = new SCMPricingProd();

  const VERSION = '20250710';
  const LOCKED_AFTER_DATE = new Date('2025-07-10T03:30:00.000Z');

  const scmGoods = await scm.scm_goods.findMany({
    where: {
      status: 1,
    },
  });

  for (const good of scmGoods) {
    const cities = await scm.scm_goods_stock_cities.findMany({
      where: {
        good_id: good.id,
      },
    });

    const pricings = await scm.scm_good_pricing.findMany({
      where: {
        goods_id: good.id,
      },
    });

    for (const pricing of pricings) {
      for (const city of cities) {
        await scmPricing.scm_good_pricing.create({
          data: {
            goods_id: good.id,
            good_unit_id: pricing.good_unit_id,
            client_tier_id: pricing.client_tier_id!,
            pricing_strategy: pricing.pricing_strategy,
            profit_margin: pricing.profit_margin,
            sale_price: pricing.sale_price,
            is_active: pricing.is_active,
            created_at: pricing.created_at,
            locked_after: LOCKED_AFTER_DATE,
            version: VERSION,
            updated_at: pricing.updated_at,
            city_id: city.cities_id,
            cut_off_time: pricing.cut_off_time,
          },
        });
      }
    }
  }
};

run();
