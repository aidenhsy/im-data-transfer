import axios from 'axios';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as IM } from './prisma/clients/im-prod';
import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';

// im-procurement delete from supplier_items; delete from supply_plan_items
// scm-pricing delete from scm_good_pricing where version = '20250710';

const run = async () => {
  const scm = new Scm();
  const im = new IM();
  const scmPricing = new ScmPricing();
  const imProcurement = new IMProcurement();

  const VERSION = '20250710';
  const LOCKED_AFTER_DATE = new Date('2025-07-10T03:30:00.000Z');

  await imProcurement.plan_item_supplier_good.deleteMany();
  await imProcurement.supply_plan_items.deleteMany();
  await imProcurement.supplier_items.deleteMany();
  await scmPricing.scm_good_pricing.deleteMany({
    where: {
      version: VERSION,
    },
  });

  const shops = await im.scm_shop.findMany({
    where: {
      status: 1,
    },
  });

  for (const shop of shops) {
    console.log(`Processing shop ${shop.shop_name}`);
    const { data } = await axios.get(
      'https://apiim.shaihukeji.com/goods/goodlist',
      {
        params: {
          shopId: shop.id,
        },
      }
    );

    for (const category of data.data) {
      for (const good of category.goods) {
        if (!good.referenceId) {
          console.log(
            `Good ${good.goodsName} ${shop.shop_name} has no reference id`
          );
          continue;
        }
        const scmGoodPricing = await scm.scm_good_pricing.findFirst({
          where: {
            id: good.referenceId,
          },
        });

        if (!scmGoodPricing) {
          console.log(
            `Good ${good.goodsName} ${shop.shop_name} has no scm good pricing`
          );
          continue;
        }

        const pricing = await scmPricing.scm_good_pricing.upsert({
          where: {
            goods_id_good_unit_id_client_tier_id_version_city_id_is_active: {
              goods_id: scmGoodPricing.goods_id,
              good_unit_id: scmGoodPricing.good_unit_id,
              client_tier_id: scmGoodPricing.client_tier_id!,
              version: VERSION,
              city_id: shop.city_id!,
              is_active: scmGoodPricing.is_active,
            },
          },
          update: {},
          create: {
            goods_id: scmGoodPricing.goods_id,
            good_unit_id: scmGoodPricing.good_unit_id,
            client_tier_id: scmGoodPricing.client_tier_id!,
            pricing_strategy: scmGoodPricing.pricing_strategy,
            profit_margin: scmGoodPricing.profit_margin,
            sale_price: scmGoodPricing.sale_price,
            is_active: scmGoodPricing.is_active,
            created_at: scmGoodPricing.created_at,
            locked_after: LOCKED_AFTER_DATE,
            version: VERSION,
            updated_at: scmGoodPricing.updated_at,
            city_id: shop.city_id,
            cut_off_time: good.soldTime,
          },
          include: {
            scm_goods: true,
          },
        });

        const supplierItem = await imProcurement.supplier_items.upsert({
          where: {
            supplier_reference_id: pricing.external_reference_id!,
          },
          update: {},
          create: {
            name: good.goodsName,
            status: 1,
            create_time: new Date(),
            update_time: new Date(),
            letter_name: good.letterName,
            supplier_id: 1,
            photo_url: good.filePath,
            price: pricing.sale_price,
            supplier_reference_id: pricing.external_reference_id!,
            cut_off_time: pricing.cut_off_time,
            package_unit_to_base_ratio: good.ratio,
            package_unit_name: good.saleUnit,
            base_unit_id: pricing.scm_goods.standard_base_unit,
            city_id: shop.city_id,
            weighing: good.weighing,
            tier_id: shop.client_tier_id!,
          },
        });

        const brand = await imProcurement.scm_shop_brand.findFirst({
          where: {
            id: shop.brand_id,
          },
          select: {
            supply_plan_id: true,
          },
        });

        const supplyPlanItem = await imProcurement.supply_plan_items.upsert({
          where: {
            supply_plan_id_item_id: {
              supply_plan_id: brand!.supply_plan_id!,
              item_id: pricing.goods_id,
            },
          },
          update: {},
          create: {
            supply_plan_id: brand!.supply_plan_id!,
            item_id: pricing.goods_id,
          },
        });

        await imProcurement.plan_item_supplier_good.create({
          data: {
            plan_item_id: supplyPlanItem.id,
            supplier_item_id: supplierItem.id,
          },
        });
      }
    }
  }
};

run();
