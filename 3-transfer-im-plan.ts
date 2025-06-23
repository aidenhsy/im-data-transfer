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

  // for (const brand of brands) {
  const brand = {
    id: 3,
    supply_plan_id: 78,
  };
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
    },
  });

  console.log('brandItems', brandItems.length);

  let processedCount = 0;
  let noPriceCount = 0;
  let noGenericItemCount = 0;
  let noSupplierGoodCount = 0;

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
      console.log(
        `No price found for ${item.goods_name} (item.id: ${item.id})`
      );
      noPriceCount++;
      continue;
    }

    const genericItem = await imProcurement.generic_items.findFirst({
      where: {
        id: scmPrice.goods_id,
      },
    });

    if (!genericItem) {
      console.log(
        `No generic item found for item.id: ${item.id} ${item.goods_name} (goods_id: ${scmPrice.goods_id})`
      );
      noGenericItemCount++;
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

    let cityProcessedCount = 0;
    for (const city of brandCities) {
      const supplierGood = await imProcurement.supplier_items.findFirst({
        where: {
          supplier_reference_id: {
            startsWith: `20250623-2-${genericItem.id}-${city.city_id}`,
          },
        },
      });

      if (!supplierGood) {
        // console.log(`No supplier good found for ${item.goods_name}`);
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

    processedCount++;
    console.log(
      `Processed item ${item.id} (${item.goods_name}) - ${cityProcessedCount} cities processed`
    );
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total brandItems: ${brandItems.length}`);
  console.log(`Successfully processed: ${processedCount}`);
  console.log(`No price found: ${noPriceCount}`);
  console.log(`No generic item found: ${noGenericItemCount}`);
  console.log(`No supplier good found: ${noSupplierGoodCount}`);
  console.log(
    `Expected total: ${processedCount + noPriceCount + noGenericItemCount}`
  );
  // }
};

run();
