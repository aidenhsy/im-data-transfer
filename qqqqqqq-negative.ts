import { DatabaseService } from './database';

interface RunningRow {
  supplier_item_id: string;
  weighted_price: number | null; // running_avg_cost_base (per base unit)
  on_hand_base: number | null; // running_qty_base
  generic_item_id: number | null;
  stock_category_id: number | null;
}

const run = async () => {
  const database = new DatabaseService();

  const counts =
    await database.imAccountingProd.inventory_month_analysis.findMany({
      where: {
        ending_count_id: {
          not: null,
        },
        month: '2025-11',
      },
      select: {
        ending_count_id: true,
        shop_id: true,
      },
      orderBy: {
        shop_id: 'asc',
      },
    });
  for (const count of counts) {
    console.log(count.shop_id, count.ending_count_id);
    const invCount = await database.imInventoryProd.inventory_count.findUnique({
      where: {
        id: count.ending_count_id!,
      },
      include: {
        inventory_count_details: true,
      },
    });

    const items: RunningRow[] = await database.imInventoryProd.$queryRaw<
      RunningRow[]
    >`SELECT DISTINCT ON (r.supplier_item_id)
  r.supplier_item_id,
  r.running_avg_cost_base AS weighted_price,
  r.running_qty_base      AS on_hand_base,
  r.generic_item_id       AS generic_item_id,
  r.stock_category_id     AS stock_category_id
FROM v_shop_item_running r
WHERE r.shop_id = ${invCount?.shop_id}
AND r.created_at <= ${invCount?.created_at}
ORDER BY r.supplier_item_id, r.created_at DESC, r.id DESC`;

    const candidates = items.filter((r) => Number(r.on_hand_base ?? 0) > 0);

    const supplierIds = candidates.map((r) => r.supplier_item_id);

    const supplierItems =
      await database.imInventoryProd.supplier_items.findMany({
        where: { id: { in: supplierIds } },
        include: {
          standard_units: true,
        },
      });

    console.log(candidates.length, invCount?.inventory_count_details.length);

    for (const item of candidates) {
      const supplierItem = supplierItems.find(
        (s) => s.id === item.supplier_item_id
      );

      if (!supplierItem) {
        console.log(`Supplier item not found for ${item.supplier_item_id}`);
        continue;
      }

      await database.imInventoryProd.inventory_count_details.upsert({
        where: {
          inventory_count_id_supplier_item_id: {
            inventory_count_id: invCount?.id!,
            supplier_item_id: item.supplier_item_id,
          },
        },
        update: {},
        create: {
          weighted_price: item.weighted_price!,
          generic_item_id: item.generic_item_id,
          stock_category_id: item.stock_category_id,
          count_unit: supplierItem.count_unit_name,
          base_qty_per_count: supplierItem.count_unit_to_base_ratio,
          base_unit: supplierItem.standard_units?.name,
          is_count: supplierItem.is_count,
          balance_qty: item.on_hand_base,
          supplier_item_id: item.supplier_item_id,
          inventory_count_id: invCount?.id!,
          shop_id: invCount?.shop_id!,
        },
      });
    }
    break;
  }
};

run();
