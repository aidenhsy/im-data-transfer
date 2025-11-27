import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const inventoryCounts =
    await database.imInventoryProd.inventory_count.findMany({
      where: {
        type: 1,
        status: 1,
      },
      select: {
        id: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

  for (const inventoryCount of inventoryCounts) {
    if (inventoryCount.id.length < 10) {
      continue;
    }
    console.log(`Inventory count ${inventoryCount.id}-----`);
    const details =
      await database.imInventoryProd.inventory_count_details.findMany({
        where: {
          inventory_count_id: inventoryCount.id,
        },
        select: {
          id: true,
        },
      });
    let totalCount = 0;

    for (const detail of details) {
      const count =
        await database.imInventoryProd.inventory_count_counts.findFirst({
          where: {
            inventory_count_detail_id: detail.id,
          },
          select: {
            id: true,
          },
        });

      if (!count) {
        await database.imInventoryProd.inventory_count_details.delete({
          where: {
            id: detail.id,
          },
        });

        await database.imInventoryProd.shop_item_weighted_price.deleteMany({
          where: {
            source_detail_id: detail.id,
          },
        });

        await database.imAccountingProd.inventory_ledger.deleteMany({
          where: {
            source_detail_id: detail.id,
          },
        });
        totalCount++;
      }
    }
    console.log(`Total count deleted: ${totalCount} / ${details.length}`);
  }
};

run();
