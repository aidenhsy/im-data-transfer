import { PrismaClient as IMProd } from './prisma/clients/im-prod';
import { PrismaClient as SCMProd } from './prisma/clients/scm-prod';
import { PrismaClient as SCMPricing } from './prisma/clients/scm-pricing';

interface Shop {
  city_id: number;
  brand_id: number;
  supply_plan_id: number;
  is_join: number;
}

const run = async () => {
  const im = new IMProd();
  const scm = new SCMProd();
  const scmPricing = new SCMPricing();

  const shops = await im.$queryRaw<Shop[]>`
    select distinct city_id, brand_id, supply_plan_id, is_join
    from scm_shop
    where status = 1
      and is_enabled = true;
  `;

  for (const shop of shops) {
    const items = await im.scm_supply_plan_scm_goods.findMany({
      where: {
        supply_plan_id: shop.supply_plan_id,
      },
    });

    for (const item of items) {
      if (!item.reference_id) {
        console.log(`Item ${item.id} has no reference_id`);
        continue;
      }

      const goodPrice = await scm.scm_good_pricing.findFirst({
        where: {
          id: item.reference_id,
        },
        include: {
          scm_good_units: true,
        },
      });

      if (!goodPrice) {
        console.log(`Good price not found for item ${item.reference_id}`);
        continue;
      }

      let clientierId = 2;
      if (shop.is_join === 1) {
        clientierId = 3;
      }

      const goodUnit = await scmPricing.scm_good_units.findFirst({
        where: {
          id: goodPrice.good_unit_id,
        },
      });

      if (!goodUnit) {
        await scmPricing.scm_good_units.create({
          data: {
            id: goodPrice.good_unit_id,
            goods_id: goodPrice.scm_good_units.goods_id,
            ratio_to_base: goodPrice.scm_good_units.ratio_to_base,
            is_base_unit: goodPrice.scm_good_units.is_base_unit,
            is_order_unit: goodPrice.scm_good_units.is_order_unit,
            name: goodPrice.scm_good_units.name,
            is_count_unit: goodPrice.scm_good_units.is_count_unit,
          },
        });
      }

      await scmPricing.scm_good_pricing.upsert({
        where: {
          goods_id_good_unit_id_client_tier_id_version_city_id: {
            goods_id: goodPrice?.goods_id!,
            good_unit_id: goodPrice?.good_unit_id!,
            client_tier_id: clientierId,
            version: '20250622',
            city_id: shop.city_id,
          },
        },
        update: {
          version: '20250622',
        },
        create: {
          goods_id: goodPrice?.goods_id!,
          good_unit_id: goodPrice?.good_unit_id!,
          client_tier_id: clientierId,
          pricing_strategy: goodPrice?.pricing_strategy!,
          profit_margin: goodPrice?.profit_margin,
          sale_price: goodPrice?.sale_price,
          is_active: goodPrice?.is_active,
          locked_after: new Date('2025-06-22T03:30:00.000Z'),
          city_id: shop.city_id,
          cut_off_time: goodPrice?.cut_off_time
            ? goodPrice.cut_off_time
            : '15:00:00',
          version: '20250622',
        },
      });
    }
  }
};

run();
