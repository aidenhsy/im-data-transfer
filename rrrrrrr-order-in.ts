import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const shopitems =
    await database.imInventoryProd.shop_item_weighted_price.findMany({
      where: {
        type: 'stock_count',
      },
      orderBy: {
        created_at: 'desc',
      },
    });

  console.log(shopitems.length);

  let badRecords = 0;
  let processedCount = 0;
  for (const shopitem of shopitems) {
    processedCount++;
    if (processedCount % 1000 === 0) {
      console.log(`Processed ${processedCount} / ${shopitems.length} items`);
    }
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

    const correctWeightedPrice = totalValue / totalQty;
    const shopItemPrice =
      Number(shopitem.total_value) / Number(shopitem.total_qty_base);

    const percentageDifference =
      Math.abs(correctWeightedPrice - shopItemPrice) / Math.abs(shopItemPrice);
    if (percentageDifference > 0.15) {
      // 20% difference
      badRecords++;
      await database.imInventoryProd.inventory_count_details.update({
        where: {
          id: shopitem.source_detail_id!,
        },
        data: {
          weighted_price: correctWeightedPrice,
        },
      });
      const newTotalValue =
        correctWeightedPrice * Number(shopitem.total_qty_base);
      await database.imInventoryProd.shop_item_weighted_price.update({
        where: {
          id: shopitem.id,
        },
        data: {
          total_value: newTotalValue,
        },
      });
      console.log(shopitem.id, correctWeightedPrice, shopItemPrice);
    }
  }
  console.log(badRecords);
};

run();
