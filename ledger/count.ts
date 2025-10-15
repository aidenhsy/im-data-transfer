import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const counts = await database.imInventoryProd.inventory_count.findMany({
    where: {
      status: 1,
      created_at: {
        gt: new Date('2025-09-30T00:00:00.000Z'),
      },
    },
    include: {
      inventory_count_details: {
        include: {
          supplier_items: true,
          generic_items: {
            include: {
              scm_goods_category: true,
            },
          },
          stock_category: true,
        },
      },
      scm_shop: true,
    },
  });

  console.log(counts.length);

  for (const count of counts) {
    console.log(`\n=== Processing count.id: ${count.id} ===`);

    const storageLocations =
      await database.imAccountingProd.storage_locations.findMany({
        where: {
          shop_id: count.shop_id,
        },
        select: {
          id: true,
          storage_code: true,
        },
      });

    const positiveDetails = count.inventory_count_details.filter(
      (detail) => Number(detail.delta_qty) > 0
    );
    const negativeDetails = count.inventory_count_details.filter(
      (detail) => Number(detail.delta_qty) < 0
    );

    // console.log('\n=== Negative Details Source Data ===');
    // negativeDetails.forEach((detail) => {
    //   console.log(`\nItem: ${detail.supplier_items?.name}`);
    //   console.log(`  delta_qty: ${detail.delta_qty}`);
    //   console.log(`  weighted_price: ${detail.weighted_price}`);
    //   console.log(`  delta_qty_value: ${detail.delta_qty_value}`);
    //   console.log(
    //     `  Calculated (delta_qty * weighted_price): ${
    //       Number(detail.delta_qty) * Number(detail.weighted_price)
    //     }`
    //   );
    //   console.log(
    //     `  Match: ${
    //       Math.abs(
    //         Number(detail.delta_qty_value) -
    //           Number(detail.delta_qty) * Number(detail.weighted_price)
    //       ) < 0.01
    //     }`
    //   );
    // });

    console.log(
      `positiveDetails.length: ${positiveDetails.length}, negativeDetails.length: ${negativeDetails.length}`
    );

    const positiveCountBill =
      await database.imAccountingProd.inventory_ledger_bill.upsert({
        where: {
          biz_type_id_source_id: {
            biz_type_id: 3,
            source_id: count.id,
          },
        },
        update: {},
        create: {
          biz_type_bill_id: 3,
          biz_type_id: 3,
          source_id: count.id,
          shop_id: count.shop_id!,
          brand_id: count.scm_shop!.brand_id,
          org_id: count.scm_shop!.big_org_id!,
        },
      });

    const positiveRemap = positiveDetails.map((detail) => ({
      biz_type_id: 3,
      source_id: count.id,
      source_detail_id: detail.id,
      shop_id: Number(count.shop_id),
      brand_id: count.scm_shop!.brand_id,
      org_id: count.scm_shop!.big_org_id!,
      supplier_item_id: detail.supplier_item_id,
      supplier_item_name: detail.supplier_items?.name,
      generic_item_id: Number(detail.generic_item_id),
      generic_item_name: detail.generic_items?.name!,
      category_id: detail.generic_items?.category_id ?? 0,
      category_name: detail.generic_items?.scm_goods_category?.name ?? '',
      stock_id: detail.stock_category_id,
      stock_name: detail.stock_category?.name,
      base_unit_qty: Number(detail.delta_qty),
      base_unit: detail.base_unit!,
      package_unit_qty: Number(detail.delta_qty),
      package_unit: detail.base_unit!,
      price: detail.weighted_price,
      total_value: Number(detail.delta_qty_value),
      created_at: count.created_at,
      updated_at: count.updated_at,
      storage_location_id: storageLocations.find(
        (storage) =>
          storage.storage_code ===
          Number(`${count.shop_id}0000${detail.stock_category_id}`)
      )?.id!,
      other_side_id: `${count.shop_id}`,
      other_side_name: count.scm_shop!.shop_name,
      other_side_type: '门店',
      bill_id: positiveCountBill.id,
      biz_type_bill_id: 3,
    }));

    for (const item of positiveRemap) {
      await database.imAccountingProd.inventory_ledger.upsert({
        where: {
          source_id_source_detail_id: {
            source_id: item.source_id,
            source_detail_id: item.source_detail_id,
          },
        },
        update: {
          ...item,
        },
        create: {
          ...item,
        },
      });
    }

    const negativeCountBill =
      await database.imAccountingProd.inventory_ledger_bill.upsert({
        where: {
          biz_type_id_source_id: {
            biz_type_id: 4,
            source_id: count.id,
          },
        },
        update: {},
        create: {
          biz_type_bill_id: 4,
          biz_type_id: 4,
          source_id: count.id,
          shop_id: count.shop_id!,
          brand_id: count.scm_shop!.brand_id,
          org_id: count.scm_shop!.big_org_id!,
        },
      });

    const negativeRemap = negativeDetails.map((detail) => ({
      biz_type_id: 4,
      source_id: count.id,
      source_detail_id: detail.id,
      shop_id: Number(count.shop_id),
      brand_id: count.scm_shop!.brand_id,
      org_id: count.scm_shop!.big_org_id!,
      supplier_item_id: detail.supplier_item_id,
      supplier_item_name: detail.supplier_items?.name,
      generic_item_id: Number(detail.generic_item_id),
      generic_item_name: detail.generic_items?.name!,
      category_id: detail.generic_items?.category_id ?? 0,
      category_name: detail.generic_items?.scm_goods_category?.name ?? '',
      stock_id: detail.stock_category_id,
      stock_name: detail.stock_category?.name,
      base_unit_qty: -Number(detail.delta_qty),
      base_unit: detail.base_unit!,
      package_unit_qty: -Number(detail.delta_qty),
      package_unit: detail.base_unit!,
      price: detail.weighted_price,
      total_value: -Number(detail.delta_qty_value),
      created_at: count.created_at,
      updated_at: count.updated_at,
      storage_location_id: storageLocations.find(
        (storage) =>
          storage.storage_code ===
          Number(`${count.shop_id}0000${detail.stock_category_id}`)
      )?.id!,
      other_side_id: `${count.shop_id}`,
      other_side_name: count.scm_shop!.shop_name,
      other_side_type: '门店',
      bill_id: negativeCountBill.id,
      biz_type_bill_id: 4,
    }));

    for (const item of negativeRemap) {
      await database.imAccountingProd.inventory_ledger.upsert({
        where: {
          source_id_source_detail_id: {
            source_id: item.source_id,
            source_detail_id: item.source_detail_id,
          },
        },
        update: {
          ...item,
        },
        create: {
          ...item,
        },
      });
    }
  }
};

run();
