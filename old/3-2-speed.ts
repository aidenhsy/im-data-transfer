import { PrismaClient as IMProd } from '../prisma/clients/im-prod';
import { PrismaClient as SCMProd } from '../prisma/clients/scm-prod';
import { PrismaClient as SCMPricingProd } from '../prisma/clients/scm-pricing-prod';
import { PrismaClient as ImProcurementProd } from '../prisma/clients/im-procurement-prod';

const run = async () => {
  const VERSION = '20250708';
  const BATCH_SIZE = 1000; // Adjust based on your database capacity

  const im = new IMProd();
  const scm = new SCMProd();
  const scmPricing = new SCMPricingProd();
  const imProcurement = new ImProcurementProd();

  const brands = await im.scm_shop_brand.findMany({
    where: {
      supply_plan_id: {
        not: null,
      },
    },
    include: {
      scm_shop: {
        where: {
          status: 1,
        },
      },
    },
  });

  for (const brand of brands) {
    console.log(
      `Processing brand ${brand.id} with supply_plan_id ${brand.supply_plan_id}`
    );

    // Update brand first
    await imProcurement.scm_shop_brand.update({
      where: { id: brand.id },
      data: { supply_plan_id: brand.supply_plan_id },
    });

    const brandItems = await im.scm_supply_plan_scm_goods.findMany({
      where: {
        supply_plan_id: brand.supply_plan_id,
        is_enabled: true,
      },
    });

    console.log(`Found ${brandItems.length} brandItems`);

    if (brandItems.length === 0) continue;

    // OPTIMIZATION 1: Batch fetch all scm_good_pricing records
    const referenceIds = brandItems
      .map((item) => item.reference_id)
      .filter((id) => id !== null);

    const scmProdPrices = await scm.scm_good_pricing.findMany({
      where: { id: { in: referenceIds } },
    });
    const scmProdPriceMap = new Map(scmProdPrices.map((p) => [p.id, p]));

    // OPTIMIZATION 2: Batch fetch all generic items
    const goodsIds = scmProdPrices.map((p) => p.goods_id);
    const genericItems = await imProcurement.generic_items.findMany({
      where: { id: { in: goodsIds } },
    });
    const genericItemMap = new Map(genericItems.map((gi) => [gi.id, gi]));

    // OPTIMIZATION 3: Batch fetch all scm pricing data with a single query
    const shopCityTierCombos = brand.scm_shop.flatMap((shop) =>
      goodsIds.map(
        (goodsId) =>
          `${VERSION}-${shop.client_tier_id}-${goodsId}-${shop.city_id}`
      )
    );

    const scmPrices = await scmPricing.scm_good_pricing.findMany({
      where: {
        external_reference_id: {
          in: shopCityTierCombos,
        },
      },
    });
    const scmPriceMap = new Map(
      scmPrices.map((sp) => [sp.external_reference_id, sp])
    );

    // OPTIMIZATION 4: Batch fetch all supplier items
    const supplierReferenceIds = scmPrices
      .map((sp) => sp.external_reference_id)
      .filter((id): id is string => id !== null);
    const supplierItems = await imProcurement.supplier_items.findMany({
      where: {
        supplier_reference_id: { in: supplierReferenceIds },
      },
    });
    const supplierItemMap = new Map(
      supplierItems.map((si) => [si.supplier_reference_id, si])
    );

    // Process items and prepare batch operations
    let processedCount = 0;
    let noPriceCount = 0;
    let noGenericItemCount = 0;
    let noSupplierItemCount = 0;
    let uniqueItemIds = new Set<number>();
    let duplicateItemIds = new Set<number>();
    let itemsWithNoPriceForAnyShop = 0;
    let totalShopPriceFailures = 0;

    interface SupplyPlanItemToUpsert {
      supply_plan_id: number;
      item_id: number;
    }

    interface PlanItemSupplierGoodToCreate {
      supply_plan_id: number;
      item_id: number;
      shop_id: number;
      supplier_item_id: string;
    }

    const supplyPlanItemsToUpsert: SupplyPlanItemToUpsert[] = [];
    const planItemSupplierGoodsToCreate: PlanItemSupplierGoodToCreate[] = [];

    for (const item of brandItems) {
      const scmProdPrice = scmProdPriceMap.get(item.reference_id!);
      if (!scmProdPrice) {
        console.log(
          `No scmProdPrice found for ${item.goods_name} (item.id: ${item.id})`
        );
        noPriceCount++;
        continue;
      }

      const genericItem = genericItemMap.get(scmProdPrice.goods_id);
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

      // Prepare supply plan item for batch upsert
      supplyPlanItemsToUpsert.push({
        supply_plan_id: brand.supply_plan_id!,
        item_id: genericItem.id,
      });

      let itemHasPriceForAnyShop = false;

      for (const shop of brand.scm_shop) {
        const priceKey = `${VERSION}-${shop.client_tier_id}-${scmProdPrice.goods_id}-${shop.city_id}`;
        const scmPrice = scmPriceMap.get(priceKey);

        if (!scmPrice) {
          totalShopPriceFailures++;
          continue;
        }

        itemHasPriceForAnyShop = true;

        const supplierItem = supplierItemMap.get(
          scmPrice.external_reference_id
        );
        if (!supplierItem) {
          console.log(
            `No supplierItem found for ${item.goods_name} (item.id: ${item.id})`
          );
          noSupplierItemCount++;
          continue;
        }

        // Prepare for batch creation (we'll get the plan_item_id after upsert)
        planItemSupplierGoodsToCreate.push({
          supply_plan_id: brand.supply_plan_id!,
          item_id: genericItem.id,
          shop_id: shop.id,
          supplier_item_id: supplierItem.id,
        });
      }

      if (!itemHasPriceForAnyShop) {
        itemsWithNoPriceForAnyShop++;
      }

      processedCount++;
    }

    // OPTIMIZATION 5: Batch upsert supply plan items
    console.log(
      `Batch upserting ${supplyPlanItemsToUpsert.length} supply plan items...`
    );

    for (let i = 0; i < supplyPlanItemsToUpsert.length; i += BATCH_SIZE) {
      const batch = supplyPlanItemsToUpsert.slice(i, i + BATCH_SIZE);

      // Use upsertMany or individual upserts in transaction
      await imProcurement.$transaction(
        batch.map((item) =>
          imProcurement.supply_plan_items.upsert({
            where: {
              supply_plan_id_item_id: {
                supply_plan_id: item.supply_plan_id,
                item_id: item.item_id,
              },
            },
            update: { item_id: item.item_id },
            create: {
              supply_plan_id: item.supply_plan_id,
              item_id: item.item_id,
            },
          })
        )
      );
    }

    // OPTIMIZATION 6: Get plan item IDs and batch create plan_item_supplier_goods
    if (planItemSupplierGoodsToCreate.length > 0) {
      console.log(
        `Creating ${planItemSupplierGoodsToCreate.length} plan item supplier goods...`
      );

      // Get the plan item IDs we just created/updated
      const planItems = await imProcurement.supply_plan_items.findMany({
        where: {
          supply_plan_id: brand.supply_plan_id,
          item_id: { in: Array.from(uniqueItemIds) },
        },
      });
      const planItemMap = new Map(planItems.map((pi) => [pi.item_id, pi.id]));

      // Map to actual records with plan_item_ids
      const recordsToCreate = planItemSupplierGoodsToCreate
        .map((record) => ({
          plan_item_id: planItemMap.get(record.item_id)!,
          shop_id: record.shop_id,
          supplier_item_id: record.supplier_item_id,
        }))
        .filter((record) => record.plan_item_id); // Only include records where we found the plan_item_id

      // Batch create in chunks
      for (let i = 0; i < recordsToCreate.length; i += BATCH_SIZE) {
        const batch = recordsToCreate.slice(i, i + BATCH_SIZE);

        try {
          await imProcurement.plan_item_supplier_good.createMany({
            data: batch,
            skipDuplicates: true, // Skip if duplicate composite keys exist
          });
        } catch (error) {
          console.error(
            `Error creating batch ${i}-${i + batch.length}:`,
            error
          );
          // Fallback to individual creates for this batch
          for (const record of batch) {
            try {
              await imProcurement.plan_item_supplier_good.create({
                data: record,
              });
            } catch (individualError) {
              console.error(
                `Error creating individual record:`,
                individualError
              );
            }
          }
        }
      }
    }

    // Final counts and investigation
    const total = await imProcurement.supply_plan_items.count({
      where: { supply_plan_id: brand.supply_plan_id },
    });

    console.log('total', total);

    // Database investigation (unchanged)
    const allRecords = await imProcurement.supply_plan_items.findMany({
      where: { supply_plan_id: brand.supply_plan_id },
      include: { generic_items: true },
    });

    console.log(`\n=== DATABASE INVESTIGATION ===`);
    console.log(
      `Total records in DB for supply_plan_id ${brand.supply_plan_id}: ${allRecords.length}`
    );

    const dbItemIds = new Set(
      allRecords
        .map((record) => record.item_id)
        .filter((id): id is number => id !== null)
    );
    const processedItemIds = uniqueItemIds;
    const extraItemIds = new Set(
      [...dbItemIds].filter((id) => !processedItemIds.has(id))
    );

    if (extraItemIds.size > 0) {
      console.log(
        `\nExtra item_ids in DB (not processed this run): ${extraItemIds.size}`
      );
      console.log('Extra item_ids:', Array.from(extraItemIds).slice(0, 10));

      const extraRecords = allRecords.filter((record) =>
        extraItemIds.has(record.item_id!)
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

run().catch(console.error);
