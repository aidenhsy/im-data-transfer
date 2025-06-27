import { PrismaClient as IMProd } from './prisma/clients/im-prod';
import { PrismaClient as SCMProd } from './prisma/clients/scm-prod';
import { PrismaClient as SCMPricing } from './prisma/clients/scm-pricing';
import { PrismaClient as ImProcurement } from './prisma/clients/im-procurement';

const run = async () => {
  const VERSION = '20250626';

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
    include: {
      scm_shop: {
        where: {
          is_enabled: true,
          status: 1,
        },
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
        is_enabled: true,
      },
    });

    console.log('brandItems', brandItems.length);

    let noPriceCount = 0;
    let noGenericItemCount = 0;
    let uniqueItemIds = new Set();
    let duplicateItemIds = new Set();

    for (const item of brandItems) {
      const scmProdPrice = await scm.scm_good_pricing.findFirst({
        where: {
          id: item.reference_id!,
        },
      });

      if (!scmProdPrice) {
        console.log(
          `No scmProdPrice found for ${item.goods_name} (item.id: ${item.id})`
        );
        noPriceCount++;
        continue;
      }

      const genericItem = await imProcurement.generic_items.findFirst({
        where: {
          id: scmProdPrice.goods_id,
        },
      });

      if (!genericItem) {
        console.log(
          `No generic item found for item.id: ${item.id} ${item.goods_name} (goods_id: ${scmProdPrice.goods_id})`
        );
        noGenericItemCount++;
        continue;
      }

      // Track duplicates
      if (uniqueItemIds.has(genericItem.id)) {
        duplicateItemIds.add(genericItem.id);
        console.log(
          `Duplicate item_id found: ${genericItem.id} (${item.goods_name}) - this will be updated, not created`
        );
      } else {
        uniqueItemIds.add(genericItem.id);
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

      for (const shop of brand.scm_shop) {
        const scmPrice = await scmPricing.scm_good_pricing.findFirst({
          where: {
            external_reference_id: {
              startsWith: `${VERSION}-${shop.client_tier_id}-${scmProdPrice.goods_id}-${shop.city_id}`,
            },
          },
        });

        if (!scmPrice) {
          console.log(
            `No scmPrice found for ${item.goods_name} (item.id: ${item.id})`
          );
          continue;
        }

        const supplierItem = await imProcurement.supplier_items.findFirst({
          where: {
            supplier_reference_id: scmPrice.external_reference_id,
          },
        });

        if (!supplierItem) {
          console.log(
            `No supplierItem found for ${item.goods_name} (item.id: ${item.id})`
          );
          continue;
        }

        await imProcurement.plan_item_supplier_good.create({
          data: {
            plan_item_id: planItem.id,
            shop_id: shop.id,
            supplier_item_id: supplierItem.id,
          },
        });
      }
    }
  }
};

run();
