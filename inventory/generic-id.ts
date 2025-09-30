import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const shopItemPrices =
    await database.imInventoryProd.shop_item_weighted_price.findMany({
      where: {
        generic_item_id: null,
        type: 'order_in',
      },
      select: {
        id: true,
        source_detail_id: true,
      },
    });

  console.log(shopItemPrices.length);

  for (const shopItemPrice of shopItemPrices) {
    const genericItem =
      await database.imProcurementProd.supplier_order_details.findUnique({
        where: {
          id: shopItemPrice.source_detail_id!,
        },
        select: {
          item_id: true,
        },
      });
    if (!genericItem) {
      continue;
    }

    await database.imInventoryProd.shop_item_weighted_price.update({
      where: {
        id: shopItemPrice.id,
      },
      data: {
        generic_item_id: genericItem.item_id,
      },
    });
  }
};

run();
