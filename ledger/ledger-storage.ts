import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const ledger = await database.imAccountingProd.inventory_ledger.findMany({
    select: {
      id: true,
      stock_id: true,
      shop_id: true,
    },
    take: 10,
    where: {
      stock_id: {
        not: null,
      },
    },
  });

  for (const item of ledger) {
    const storageCode = `${item.shop_id}0000${item.stock_id}`;
    const storageLocation =
      await database.imAccountingProd.storage_locations.findFirst({
        where: {
          storage_code: Number(storageCode),
        },
      });
    if (!storageLocation) {
      continue;
    }

    await database.imAccountingProd.inventory_ledger.update({
      where: {
        id: item.id,
      },
      data: {
        storage_location_id: storageLocation.id,
      },
    });
  }
};

run();
