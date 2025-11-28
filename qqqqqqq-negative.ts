// import { DatabaseService } from './database';
import { DatabaseLocalService } from './database-local';

const run = async () => {
  const database = new DatabaseLocalService();

  let count = 0;
  const shops = await database.imInventoryLocal.scm_shop.findMany({
    select: {
      id: true,
    },
  });
  console.log('shops.length', shops.length);

  const supplierItems = await database.imInventoryLocal.supplier_items.findMany(
    {
      select: {
        id: true,
      },
    }
  );

  console.log('supplierItems.length', supplierItems.length);

  for (const shop of shops) {
    for (const supplierItem of supplierItems) {
      const shopItem =
        await database.imInventoryLocal.shop_item_weighted_price.findFirst({
          where: {
            shop_id: shop.id,
            supplier_item_id: supplierItem.id,
          },
          orderBy: {
            created_at: 'asc',
          },
        });
      if (!shopItem) {
        continue;
      }
      if (Number(shopItem?.total_qty) < 0) {
        console.log(shopItem?.id, shop.id, supplierItem.id);
        count++;
      }
    }
  }

  console.log(count);
};

run();
