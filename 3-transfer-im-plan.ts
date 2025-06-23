import { PrismaClient as IMProd } from './prisma/clients/im-prod';
import { PrismaClient as SCMProd } from './prisma/clients/scm-prod';
import { PrismaClient as SCMPricing } from './prisma/clients/scm-pricing';
import { PrismaClient as ImProcurement } from './prisma/clients/im-procurement';

const run = async () => {
  const im = new IMProd();
  const scm = new SCMProd();
  const scmPricing = new SCMPricing();
  const imProcurement = new ImProcurement();

  const brands = await im.scm_shop_brand.findMany({
    where: {
      supply_plan_id: {
        not: null,
      },
    },
  });

  for (const brand of brands) {
    await imProcurement.scm_shop_brand.update({
      where: {
        id: brand.id,
      },
      data: {
        supply_plan_id: brand.supply_plan_id,
      },
    });

    const brandItems = await im.scm_supply_plan_scm_goods.findMany({
      where: {
        supply_plan_id: brand.supply_plan_id,
      },
    });

    for (const item of brandItems) {
      const scmProdPrice = await scm.scm_good_pricing.findFirst({
        where: {
          id: item.reference_id!,
        },
      });

      const scmPrice = await scmPricing.scm_good_pricing.findFirst({
        where: {
          external_reference_id: {
            startsWith: `20250623-2-${scmProdPrice?.goods_id}`,
          },
        },
      });

      if (!scmPrice) {
        console.log(`No price found for ${item.goods_name}`);
        continue;
      }

      const genericItem = await imProcurement.generic_items.findFirst({
        where: {
          id: scmPrice.goods_id,
        },
      });

      if (!genericItem) {
        console.log(`No generic item found for ${item.goods_name}`);
        continue;
      }

      const planItem = await imProcurement.supply_plan_items.upsert({
        where: {
          supply_plan_id_item_id: {
            supply_plan_id: brand.supply_plan_id!,
            item_id: genericItem.id,
          },
        },
        update: {
          item_id: genericItem.id,
        },
        create: {
          supply_plan_id: brand.supply_plan_id,
          item_id: genericItem.id,
        },
      });

      console.log(planItem.id);
    }
  }
};

run();
