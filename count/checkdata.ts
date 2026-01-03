import { DatabaseService } from '../database';
import axios from 'axios';

const run = async () => {
  const database = new DatabaseService();

  const counts = await database.imInventoryProd.inventory_count.findMany({
    where: {
      created_at: {
        gt: new Date('2025-12-02T00:00:00.000Z'),
      },
      type: 1,
    },
    orderBy: {
      created_at: 'asc',
    },
  });

  console.log(counts.length);

  // for (const count of counts) {
  //   console.log(count.created_at, count.id);
  //   // reaudit
  //   const { data: reauditData } = await axios.post(
  //     'https://imms.shaihukeji.com/inventory/update/reaudit',
  //     {
  //       count_id: count.id,
  //     }
  //   );
  //   console.log(reauditData);
  //   const { data: submitData } = await axios.post(
  //     'https://imms.shaihukeji.com/inventory/count/submit',
  //     {
  //       count_id: count.id,
  //     }
  //   );
  //   console.log(submitData);
  // }

  for (const countItem of counts) {
    const countId = countItem.id;
    const count = await database.imInventoryProd.inventory_count.findUnique({
      where: {
        id: countId,
      },
      include: {
        inventory_count_details: true,
      },
    });

    const runningItems = await database.imInventoryProd.$queryRaw<
      any[]
    >`  SELECT DISTINCT ON (r.supplier_item_id)
    r.supplier_item_id,
    r.running_avg_cost_base AS weighted_price,
    r.running_qty_base      AS on_hand_base,
    r.generic_item_id       AS generic_item_id,
    r.stock_category_id     AS stock_category_id
  FROM v_shop_item_running r
  WHERE r.shop_id = ${Number(count?.shop_id)}
  AND r.created_at <= ${count?.created_at}
  ORDER BY r.supplier_item_id, r.created_at DESC, r.id DESC`;

    const ids = runningItems.map((i) => i.supplier_item_id);

    const supplierItems =
      await database.imInventoryProd.supplier_items.findMany({
        where: { id: { in: ids } },
        include: {
          standard_units: true,
        },
      });

    // Get supplier_item_ids already in inventory_count_details
    const existingSupplierItemIds = new Set(
      count?.inventory_count_details?.map((d) => d.supplier_item_id) ?? []
    );

    // Filter for items in runningItems but NOT in inventory_count_details
    const candidates = runningItems.filter(
      (item) => !existingSupplierItemIds.has(item.supplier_item_id)
    );

    console.log('missing candidates', candidates.length);

    // Get the candidate supplier_item_ids
    const candidateIds = new Set(candidates.map((c) => c.supplier_item_id));

    // Filter supplierItems to only include candidates
    const filteredSupplierItems = supplierItems.filter((item) =>
      candidateIds.has(item.id)
    );

    const details = filteredSupplierItems.map((item) => {
      const candidate = candidates.find((c) => c.supplier_item_id === item.id);

      return {
        weighted_price: Number(candidate?.weighted_price ?? 0),
        supplier_item_id: item.id,
        generic_item_id: candidate?.generic_item_id
          ? Number(candidate.generic_item_id)
          : null,
        inventory_count_id: countId,
        shop_id: Number(count?.shop_id),
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
          inventory_count_id: countId,
          supplier_item_id: {
            in: details.map((d) => d.supplier_item_id),
          },
        },
        select: {
          id: true,
          is_count: true,
          count_unit: true,
        },
      });

    await database.imInventoryProd.inventory_count_counts.createMany({
      data: countDetails.map((detail) => ({
        inventory_count_detail_id: detail.id,
        unit_id: 40,
        unit_name: detail.count_unit ?? '',
        qty: 0,
      })),
    });

    console.log('updated', countId);
  }
  console.log('done');
};

run();
