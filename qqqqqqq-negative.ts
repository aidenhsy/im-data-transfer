import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const take = 1000;
  let skip = 0;

  while (true) {
    console.log(`Processing batch ${skip + 1} to ${skip + take}`);
    const orders =
      await database.imProcurementProd.supplier_order_details.findMany({
        orderBy: {
          id: 'asc',
        },
        take,
        skip,
        where: {
          supplier_orders: {
            status: 4,
            receive_time: {
              gte: new Date('2025-11-01T00:00:00.000Z'),
            },
          },
        },
      });

    const shopItems =
      await database.imInventoryProd.shop_item_weighted_price.findMany({
        where: {
          source_detail_id: {
            in: orders.map((order) => order.id),
          },
        },
      });

    if (shopItems.length !== orders.length) {
      const missingShopItems = orders.filter(
        (order) =>
          !shopItems.some((shopItem) => shopItem.source_detail_id === order.id)
      );
      console.log(missingShopItems);
      continue;
    }

    if (orders.length === 0) {
      break;
    }

    skip += take;
  }
};

run();
