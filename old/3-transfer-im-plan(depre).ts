import { PrismaClient as IMProd } from '../prisma/clients/im-prod';
import { PrismaClient as SCMProd } from '../prisma/clients/scm-prod';
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

    const brandCities = await imProcurement.brand_cities.findMany({
      where: {
        brand_id: brand.id,
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
    let noSupplierGoodCount = 0;
    let uniqueItemIds = new Set();
    let duplicateItemIds = new Set();
    let itemsWithNoPriceForAnyCity = 0;
    let totalCityPriceFailures = 0;

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

      let cityProcessedCount = 0;
      let itemHasPriceForAnyCity = false;

      for (const city of brandCities) {
        // Look for city-specific pricing
        const scmPrice = await scmPricing.scm_good_pricing.findFirst({
          where: {
            external_reference_id: {
              startsWith: `${VERSION}-2-${scmProdPrice.goods_id}-${city.city_id}`,
            },
          },
        });

        if (!scmPrice) {
          // console.log(`${VERSION}-2-${scmProdPrice.goods_id}-${city.city_id}`);
          // console.log(
          //   `No city-specific price found for ${item.goods_name} in city ${city.city_id}`
          // );
          totalCityPriceFailures++;
          continue;
        }

        itemHasPriceForAnyCity = true;

        const supplierGood = await imProcurement.supplier_items.findFirst({
          where: {
            supplier_reference_id: {
              startsWith: `${VERSION}-2-${genericItem.id}-${city.city_id}`,
            },
          },
        });

        if (!supplierGood) {
          console.log(`No supplier good found for ${item.goods_name}`);
          noSupplierGoodCount++;
          continue;
        }

        await imProcurement.plan_item_supplier_good.upsert({
          where: {
            plan_item_id_city_id: {
              plan_item_id: planItem.id,
              city_id: city.city_id!,
            },
          },
          update: {
            supplier_item_id: supplierGood.id,
          },
          create: {
            plan_item_id: planItem.id,
            supplier_item_id: supplierGood.id,
            city_id: city.city_id!,
          },
        });
        cityProcessedCount++;
      }

      if (!itemHasPriceForAnyCity) {
        itemsWithNoPriceForAnyCity++;
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
      `Items with no price for ANY city: ${itemsWithNoPriceForAnyCity}`
    );
    console.log(`Total city price failures: ${totalCityPriceFailures}`);
    console.log(`No generic item found: ${noGenericItemCount}`);
    console.log(`No supplier good found: ${noSupplierGoodCount}`);
    console.log(`Unique item_ids: ${uniqueItemIds.size}`);
    console.log(`Duplicate item_ids: ${duplicateItemIds.size}`);
    console.log(
      `Expected total: ${
        processedCount + itemsWithNoPriceForAnyCity + noGenericItemCount
      }`
    );
    console.log(`Actual total in DB: ${total}`);
    console.log(
      `Difference: ${
        processedCount + itemsWithNoPriceForAnyCity + noGenericItemCount - total
      }`
    );
  }
};

run();
