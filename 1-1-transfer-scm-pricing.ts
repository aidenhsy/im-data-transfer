import { PrismaClient as IMProd } from './prisma/clients/im-prod';
import { PrismaClient as SCMProd } from './prisma/clients/scm-prod';
import { PrismaClient as SCMPricing } from './prisma/clients/scm-pricing';

const run = async () => {
  const scm = new SCMProd();
  const im = new IMProd();
  const scmPricing = new SCMPricing();

  const VERSION = '20250627';
  const LOCKED_AFTER_DATE = new Date('2025-06-27T03:30:00.000Z');

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
      const {
        scm_goods: { last_ware_price, ...create_fields },
        ...rest
      } = prod;
      await scmPricing.scm_goods.create({
        data: create_fields,
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

    const planIds = await im.scm_supply_plan_scm_goods.findMany({
      where: {
        reference_id: prod.id,
      },
      distinct: ['supply_plan_id'],
      select: {
        supply_plan_id: true,
      },
    });
    const shops = await im.scm_shop.findMany({
      where: {
        supply_plan_id: {
          in: planIds.map((i) => i.supply_plan_id).filter((i) => i !== null),
        },
      },
      distinct: ['city_id'],
      select: {
        city_id: true,
      },
    });

    if (shops.length === 0) {
      await scmPricing.scm_good_pricing.create({
        data: {
          client_tier_id: prod.client_tier_id,
          profit_margin: prod.profit_margin,
          sale_price: prod.sale_price,
          is_active: prod.is_active,
          city_id: 1,
          cut_off_time: prod?.cut_off_time ? prod.cut_off_time : '15:00:00',
          goods_id: prod.goods_id,
          good_unit_id: prod.good_unit_id,
          pricing_strategy: prod.pricing_strategy,
          version: VERSION,
          locked_after: LOCKED_AFTER_DATE,
        },
      });
      continue;
    }

    for (const shop of shops) {
      await scmPricing.scm_good_pricing.create({
        data: {
          client_tier_id: prod.client_tier_id,
          profit_margin: prod.profit_margin,
          sale_price: prod.sale_price,
          is_active: prod.is_active,
          city_id: shop.city_id,
          cut_off_time: prod?.cut_off_time ? prod.cut_off_time : '15:00:00',
          goods_id: prod.goods_id,
          good_unit_id: prod.good_unit_id,
          pricing_strategy: prod.pricing_strategy,
          version: VERSION,
          locked_after: LOCKED_AFTER_DATE,
        },
      });
    }
  }

  const devPricings = await scmPricing.scm_good_pricing.count({
    where: {
      version: VERSION,
    },
  });

  console.log('Total devPricings', devPricings);
};

run();
