import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const shopitems =
    await database.imInventoryProd.shop_item_weighted_price.findMany({
      where: {
        type: 'stock_count',
      },
      orderBy: {
        created_at: 'asc',
      },
    });

  console.log(shopitems.length);

  for (const shopitem of shopitems) {
    const previousItems =
      await database.imInventoryProd.shop_item_weighted_price.findMany({
        where: {
          supplier_item_id: shopitem.supplier_item_id,
          shop_id: shopitem.shop_id,
          created_at: {
            lt: shopitem.created_at,
          },
        },
      });
    if (previousItems.length === 0) {
      await database.imInventoryProd.shop_item_weighted_price.delete({
        where: {
          id: shopitem.id,
        },
      });
      continue;
    }

    const totalQty = previousItems.reduce(
      (acc, item) => acc + Number(item.total_qty_base),
      0
    );
    const totalValue = previousItems.reduce(
      (acc, item) => acc + Number(item.total_value),
      0
    );

    const weightedPrice = totalValue / totalQty;
    const shopItemPrice =
      Number(shopitem.total_value) / Number(shopitem.total_qty_base);

    if (Math.abs(weightedPrice - shopItemPrice) > 0.0001) {
      console.log(shopitem.id, weightedPrice, shopItemPrice);
    }
  }
};

run();
