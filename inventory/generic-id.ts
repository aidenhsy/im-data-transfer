import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const shopItemPrices =
    await database.imInventoryProd.shop_item_weighted_price.findMany({
      where: {
        generic_item_id: null,
        type: 'order_return',
      },
      select: {
        id: true,
        source_detail_id: true,
      },
    });

  console.log(shopItemPrices.length);

  for (const shopItemPrice of shopItemPrices) {
    const genericItem =
      await database.imProcurementProd.supplier_order_return_details.findUnique(
        {
          where: {
            id: shopItemPrice.source_detail_id!,
          },
          select: {
            supplier_order_details: {
              select: {
                item_id: true,
              },
            },
          },
        }
      );
    if (!genericItem) {
      continue;
    }

    await database.imInventoryProd.shop_item_weighted_price.update({
      where: {
        id: shopItemPrice.id,
      },
      data: {
        generic_item_id: genericItem.supplier_order_details.item_id,
      },
    });
  }
};

run();
