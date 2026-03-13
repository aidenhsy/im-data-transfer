import { DatabaseService } from '../database';

const DRY_RUN = false;

const run = async () => {
  const database = new DatabaseService();

  try {
    const counts = await database.imInventoryProd.inventory_count.findMany({
      where: {
        id: '2e855f49-4a75-443c-892f-0d4888659915'
        // created_at: {
        //   gt: new Date('2026-02-28T00:00:00Z'),
        //   lt: new Date('2026-03-02T00:00:00Z'),
        // },
        // scm_shop: {
        //   brand_id: 6,
        // },
        // type: 1,
      },
      include: {
        inventory_count_details: {
          include: {
            supplier_items: true,
          },
        },
        scm_shop: true,
      },
    });

    const uniqueShops = [...new Set(counts.map((count) => count.shop_id))];




    if (uniqueShops.length !== counts.length) {
      console.log('uniqueShops.length !== counts.length — aborting');
      return;
    }

    for (const count of counts) {
      const stockInDetails = await database.imProcurementProd.supplier_order_details.findMany({
        distinct: ['supplier_item_id'],
        where: {
          supplier_item_id: { not: null },
          supplier_orders: {
            shop_id: count.shop_id!,
            status: 4,
            delivery_time: {
              gt: new Date('2026-01-01T00:00:00Z'),
              lt: new Date('2026-03-02T00:00:00Z'),
            },
          },
        },
        select: { supplier_item_id: true },
      });

      const runningRows = await database.imInventoryProd.$queryRaw<
        {
          supplier_item_id: string;
          weighted_price: string;
          on_hand_base: string;
          generic_item_id: string | null;
          stock_category_id: string | null;
        }[]
      >`
        SELECT DISTINCT ON (r.supplier_item_id)
          r.supplier_item_id,
          r.running_avg_cost_base AS weighted_price,
          r.running_qty_base      AS on_hand_base,
          r.generic_item_id       AS generic_item_id,
          r.stock_category_id     AS stock_category_id
        FROM v_shop_item_running r
        WHERE r.shop_id = ${count.shop_id}
          AND r.created_at <= ${count.created_at}
        ORDER BY r.supplier_item_id, r.created_at DESC, r.id DESC
      `;

      const detailIds = new Set(count.inventory_count_details.map((d) => d.supplier_item_id));
      const missingRows = runningRows.filter((r) => !detailIds.has(r.supplier_item_id));

      const stockInIds = stockInDetails
        .map((d) => d.supplier_item_id)
        .filter((id): id is string => id !== null);
      const missingFromStockIn = stockInIds.filter((id) => !detailIds.has(id));

      const shopName = count.scm_shop?.shop_name ?? `shop ${count.shop_id}`;
      console.log(
        `\n[${shopName}] existing: ${count.inventory_count_details.length} | running missing: ${missingRows.length} | stock-in missing: ${missingFromStockIn.length}`,
      );
      // stock-in items not already covered by the running diff
      const runningMissingIds = new Set(missingRows.map((r) => r.supplier_item_id));
      const stockInOnlyIds = missingFromStockIn.filter((id) => !runningMissingIds.has(id));

      const allMissingIds = [
        ...missingRows.map((r) => r.supplier_item_id),
        ...stockInOnlyIds,
      ];

      if (allMissingIds.length === 0) continue;

      const supplierItems = await database.imInventoryProd.supplier_items.findMany({
        where: { id: { in: allMissingIds } },
        include: { standard_units: true },
      });

      const details = supplierItems.map((item) => {
        const runningRow = missingRows.find((r) => r.supplier_item_id === item.id);
        const isFromStockInOnly = !runningRow;

        if (isFromStockInOnly) {
          console.log(`  [stock-in] ${item.name}`);
        } else {
          console.log(`  [running]  ${item.name} (on_hand: ${runningRow.on_hand_base})`);
        }

        return {
          weighted_price: runningRow ? Number(runningRow.weighted_price ?? 0) : 0,
          supplier_item_id: item.id,
          generic_item_id: runningRow?.generic_item_id ? Number(runningRow.generic_item_id) : null,
          inventory_count_id: count.id,
          shop_id: count.shop_id,
          stock_category_id: runningRow?.stock_category_id ? Number(runningRow.stock_category_id) : null,
          count_unit: item.count_unit_name,
          base_qty_per_count: item.count_unit_to_base_ratio,
          base_unit: item.standard_units?.name,
          is_count: item.is_count,
          balance_qty: runningRow ? Math.max(Number(runningRow.on_hand_base ?? 0), 0) : 0,
        };
      });

      if (DRY_RUN) {
        console.log(`  [DRY RUN] would insert ${details.length} detail(s) (${missingRows.length} running + ${stockInOnlyIds.length} stock-in only) — skipping`);
        continue;
      }

      await database.imInventoryProd.$transaction(async (tx) => {
        await tx.inventory_count_details.createMany({ data: details });

        const newDetails = await tx.inventory_count_details.findMany({
          where: {
            inventory_count_id: count.id,
            supplier_item_id: { in: supplierItems.map((i) => i.id) },
            is_count: false,
          },
          select: { id: true, count_unit: true },
        });

        if (newDetails.length > 0) {
          await tx.inventory_count_counts.createMany({
            data: newDetails.map((d) => ({
              inventory_count_detail_id: d.id,
              unit_id: 40,
              unit_name: d.count_unit ?? '',
              qty: 0,
            })),
          });
        }
      });

      console.log(`  inserted ${details.length} detail(s) (${missingRows.length} running + ${stockInOnlyIds.length} stock-in only) for ${count.scm_shop?.shop_name}`);
    }
  } finally {
    await database.disconnect();
  }
};

run();
