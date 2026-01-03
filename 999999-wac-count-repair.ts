import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();
  const shop_id = 1;

  const counts = await database.imInventoryProd.inventory_count.findMany({
    where: {
      type: 1,
      shop_id: shop_id,
      created_at: {
        gt: new Date('2025-11-01T00:00:00.000Z'),
      },
    },
    select: {
      id: true,
      created_at: true,
      inventory_count_details: {
        select: {
          supplier_item_id: true,
        },
      },
    },
    orderBy: {
      created_at: 'asc',
    },
  });

  for (const count of counts) {
    console.log(count.created_at, count.id);
    const allSupplierItemIds = count.inventory_count_details.map(
      (detail) => detail.supplier_item_id
    );

    const runningRows = await database.imInventoryProd.$queryRaw<
      any[]
    >` SELECT DISTINCT ON (r.supplier_item_id)
    r.supplier_item_id,
    r.running_avg_cost_base AS weighted_price,
    r.running_qty_base      AS on_hand_base,
    r.generic_item_id       AS generic_item_id,
    r.stock_category_id     AS stock_category_id
FROM v_shop_item_running r
WHERE r.shop_id = ${shop_id}
AND r.created_at <= ${count.created_at}
ORDER BY r.supplier_item_id, r.created_at DESC, r.id DESC`;
    const candidates = runningRows.filter(
      (r) => Number(r.on_hand_base ?? 0) > 0
    );
    const original = allSupplierItemIds;
    const newItems = candidates.map((r) => r.supplier_item_id);
    console.log('original', original.length);
    console.log('new', newItems.length);
    const missingIds = newItems.filter((id) => !original.includes(id));
    if (missingIds.length <= 0) {
      continue;
    }
    const supplierItems =
      await database.imInventoryProd.supplier_items.findMany({
        where: {
          id: {
            in: missingIds,
          },
        },
        include: {
          standard_units: true,
        },
      });
    const details = supplierItems.map((item) => {
      const candidate = candidates.find((c) => c.supplier_item_id === item.id);

      return {
        weighted_price: Number(candidate?.weighted_price ?? 0),
        supplier_item_id: item.id,
        generic_item_id: candidate?.generic_item_id
          ? Number(candidate.generic_item_id)
          : null,
        inventory_count_id: count.id,
        shop_id,
        stock_category_id: candidate?.stock_category_id
          ? Number(candidate.stock_category_id)
          : null,
        count_unit: item.count_unit_name,
        base_qty_per_count: item.count_unit_to_base_ratio,
        base_unit: item.standard_units?.name,
        is_count: item.is_count,
        balance_qty: candidate?.on_hand_base,
      };
    });
    await database.imInventoryProd.inventory_count_details.createMany({
      data: details,
    });
    const countDetails =
      await database.imInventoryProd.inventory_count_details.findMany({
        where: {
          inventory_count_id: count.id,
          is_count: false,
        },
        select: {
          id: true,
          is_count: true,
          count_unit: true,
        },
      });

    for (const detail of countDetails) {
      await database.imInventoryProd.inventory_count_counts.upsert({
        where: {
          inventory_count_detail_id_unit_id: {
            inventory_count_detail_id: detail.id,
            unit_id: 40,
          },
        },
        update: {},
        create: {
          inventory_count_detail_id: detail.id,
          unit_id: 40,
          unit_name: detail.count_unit ?? '',
          qty: 0,
        },
      });
    }
    console.log('--------------------------------');
  }
};

run();
