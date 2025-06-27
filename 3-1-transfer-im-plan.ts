import { PrismaClient as IMProd } from './prisma/clients/im-prod';
import { PrismaClient as SCMProd } from './prisma/clients/scm-prod';
import { PrismaClient as SCMPricing } from './prisma/clients/scm-pricing';
import { PrismaClient as ImProcurement } from './prisma/clients/im-procurement';

const run = async () => {
  const VERSION = '20250627';

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

    let processedCount = 0;
    let noPriceCount = 0;
    let noGenericItemCount = 0;
    let noSupplierItemCount = 0;
    let uniqueItemIds = new Set();
    let duplicateItemIds = new Set();
    let itemsWithNoPriceForAnyShop = 0;
    let totalShopPriceFailures = 0;

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

      let shopProcessedCount = 0;
      let itemHasPriceForAnyShop = false;

      for (const shop of brand.scm_shop) {
        const scmPrice = await scmPricing.scm_good_pricing.findFirst({
          where: {
            external_reference_id: {
              startsWith: `${VERSION}-${shop.client_tier_id}-${scmProdPrice.goods_id}-${shop.city_id}`,
            },
          },
        });

        if (!scmPrice) {
          // console.log(
          //   `No scmPrice found for ${VERSION}-${shop.client_tier_id}-${scmProdPrice.goods_id}-${shop.city_id}`
          // );
          totalShopPriceFailures++;
          continue;
        }

        itemHasPriceForAnyShop = true;

        const supplierItem = await imProcurement.supplier_items.findFirst({
          where: {
            supplier_reference_id: scmPrice.external_reference_id,
          },
        });

        if (!supplierItem) {
          console.log(
            `No supplierItem found for ${item.goods_name} (item.id: ${item.id})`
          );
          noSupplierItemCount++;
          continue;
        }

        await imProcurement.plan_item_supplier_good.create({
          data: {
            plan_item_id: planItem.id,
            shop_id: shop.id,
            supplier_item_id: supplierItem.id,
          },
        });
        shopProcessedCount++;
      }

      if (!itemHasPriceForAnyShop) {
        itemsWithNoPriceForAnyShop++;
      }

      processedCount++;
    }

    const total = await imProcurement.supply_plan_items.count({
      where: {
        supply_plan_id: brand.supply_plan_id,
      },
    });

    console.log('total', total);

    // Investigate what records exist in the database
    const allRecords = await imProcurement.supply_plan_items.findMany({
      where: {
        supply_plan_id: brand.supply_plan_id,
      },
      include: {
        generic_items: true, // Include the generic_items details
      },
    });

    console.log(`\n=== DATABASE INVESTIGATION ===`);
    console.log(
      `Total records in DB for supply_plan_id ${brand.supply_plan_id}: ${allRecords.length}`
    );

    // Check if any records have item_ids that weren't in our processed set
    const dbItemIds = new Set(allRecords.map((record) => record.item_id));
    const processedItemIds = uniqueItemIds;
    const extraItemIds = new Set(
      [...dbItemIds].filter((id) => !processedItemIds.has(id))
    );

    if (extraItemIds.size > 0) {
      console.log(
        `\nExtra item_ids in DB (not processed this run): ${extraItemIds.size}`
      );
      console.log('Extra item_ids:', Array.from(extraItemIds).slice(0, 10)); // Show first 10

      const extraRecords = allRecords.filter((record) =>
        extraItemIds.has(record.item_id)
      );
      console.log('\nSample extra records:');
      extraRecords.slice(0, 5).forEach((record) => {
        console.log(
          `  - item_id: ${record.item_id}, item_name: ${
            record.generic_items?.name || 'N/A'
          }`
        );
      });
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total brandItems: ${brandItems.length}`);
    console.log(`Successfully processed: ${processedCount}`);
    console.log(
      `Items with no price for ANY shop: ${itemsWithNoPriceForAnyShop}`
    );
    console.log(`Total shop price failures: ${totalShopPriceFailures}`);
    console.log(`No generic item found: ${noGenericItemCount}`);
    console.log(`No supplier item found: ${noSupplierItemCount}`);
    console.log(`Unique item_ids: ${uniqueItemIds.size}`);
    console.log(`Duplicate item_ids: ${duplicateItemIds.size}`);
    console.log(
      `Expected total: ${
        processedCount + itemsWithNoPriceForAnyShop + noGenericItemCount
      }`
    );
    console.log(`Actual total in DB: ${total}`);
    console.log(
      `Difference: ${
        processedCount + itemsWithNoPriceForAnyShop + noGenericItemCount - total
      }`
    );
  }
};

run();
