import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const beginningCounts =
    await database.imAccountingProd.inventory_month_analysis.findMany({
      where: {
        month: '2025-10',
        beginning_count_id: {
          not: null,
        },
        shop_id: {
          in: [29, 147, 118, 140, 44, 35],
        },
      },
      select: {
        shop_id: true,
        beginning_count_id: true,
      },
    });

  for (const beginningCount of beginningCounts) {
    console.log(beginningCount.shop_id);
    const nonZeroItems =
      await database.imInventoryProd.inventory_count_details.findMany({
        where: {
          inventory_count_id: beginningCount.beginning_count_id!,
          count_qty: {
            gt: 0,
          },
        },
        select: {
          supplier_item_id: true,
        },
      });
    const inBoundItems =
      await database.imProcurementProd.supplier_order_details.findMany({
        distinct: ['supplier_item_id'],
        select: {
          supplier_item_id: true,
        },
        where: {
          supplier_orders: {
            shop_id: Number(beginningCount.shop_id),
            receive_time: {
              gte: new Date('2025-10-01T00:00:00.000Z'),
              lte: new Date('2025-10-31T23:59:59.999Z'),
            },
          },
        },
      });

    // Get unique supplier item IDs from nonZeroItems
    const uniqueNonZeroIds = [
      ...new Set(nonZeroItems.map((item) => item.supplier_item_id)),
    ];

    // Get unique supplier item IDs from inBoundItems
    const uniqueInBoundIds = [
      ...new Set(inBoundItems.map((item) => item.supplier_item_id)),
    ];

    console.log('Unique nonZero supplier item IDs:', uniqueNonZeroIds.length);
    console.log('Unique inBound supplier item IDs:', uniqueInBoundIds.length);

    // Optional: Get unique IDs that appear in both
    const commonIds = uniqueNonZeroIds.filter((id) =>
      uniqueInBoundIds.includes(id)
    );
    console.log('Common supplier item IDs:', commonIds.length);

    // Optional: Get unique IDs that appear in either (union)
    const allUniqueIds = [
      ...new Set([...uniqueNonZeroIds, ...uniqueInBoundIds]),
    ];
    console.log('All unique supplier item IDs (union):', allUniqueIds.length);

    const lastAllCount =
      await database.imInventoryProd.inventory_count.findFirst({
        where: {
          shop_id: Number(beginningCount.shop_id),
          type: 1,
        },
        include: {
          inventory_count_details: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

    console.log(
      'lastAllCount?.inventory_count_details.length:',
      lastAllCount?.inventory_count_details.length
    );

    console.log('--------------------------------');

    // Find items that exist in allUniqueIds but NOT in lastAllCount
    const lastAllCountIds =
      lastAllCount?.inventory_count_details.map(
        (detail) => detail.supplier_item_id
      ) || [];
    const missingItems = allUniqueIds.filter(
      (id) => !lastAllCountIds.includes(id!)
    );
    if (missingItems.length === 0) {
      console.log('No missing items');
      continue;
    }
    for (const supplierItemId of missingItems) {
      const lastOrderDetail =
        await database.imProcurementProd.supplier_order_details.findFirst({
          where: {
            supplier_item_id: supplierItemId!,
          },
          orderBy: {
            created_at: 'desc',
          },
          select: {
            price: true,
            package_unit_to_base_ratio: true,
            package_unit_name: true,
            stock_category: true,
            item_id: true,
            stock_category_id: true,
            generic_items: {
              include: {
                standard_units: true,
              },
            },
          },
        });
      if (!lastOrderDetail) {
        console.log(
          `No last order detail for supplierItemId: ${supplierItemId}`
        );
        continue;
      }
      const newDetail =
        await database.imInventoryProd.inventory_count_details.upsert({
          where: {
            inventory_count_id_supplier_item_id: {
              inventory_count_id: lastAllCount?.id!,
              supplier_item_id: supplierItemId!,
            },
          },
          update: {},
          create: {
            weighted_price: Number(lastOrderDetail?.price),
            supplier_item_id: supplierItemId!,
            generic_item_id: lastOrderDetail?.item_id,
            inventory_count_id: lastAllCount?.id!,
            shop_id: Number(beginningCount.shop_id),
            stock_category_id: lastOrderDetail?.stock_category_id,
            count_unit: lastOrderDetail?.package_unit_name,
            base_qty_per_count: lastOrderDetail?.package_unit_to_base_ratio,
            base_unit: lastOrderDetail?.generic_items?.standard_units?.name,
            is_count: true,
            balance_qty: 0,
          },
        });
      await database.imInventoryProd.inventory_count_counts.upsert({
        where: {
          inventory_count_detail_id_unit_id: {
            unit_id: 40,
            inventory_count_detail_id: newDetail.id,
          },
        },
        update: {},
        create: {
          inventory_count_detail_id: newDetail.id,
          unit_id: 40,
          unit_name: lastOrderDetail?.package_unit_name ?? '',
          qty: 0,
        },
      });
    }
  }
};

run();
