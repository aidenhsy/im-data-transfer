import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const nullRecords =
    await database.imInventoryProd.shop_item_weighted_price.findMany({
      where: {
        generic_item_id: null,
      },
      select: {
        id: true,
        supplier_item_id: true,
      },
    });

  console.log(nullRecords.length);

  for (const record of nullRecords) {
    const item =
      await database.imInventoryProd.shop_item_weighted_price.findFirst({
        where: {
          supplier_item_id: record.supplier_item_id,
          generic_item_id: {
            not: null,
          },
        },
      });
    if (item) {
      await database.imInventoryProd.shop_item_weighted_price.update({
        where: {
          id: record.id,
        },
        data: {
          generic_item_id: item.generic_item_id,
        },
      });
    }
  }

  process.exit(0);
};

run();
