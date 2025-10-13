import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const details =
    await database.imInventoryProd.inventory_count_details.findMany({
      where: {
        stock_category_id: null,
      },
      select: {
        id: true,
        supplier_item_id: true,
        shop_id: true,
      },
    });

  for (const detail of details) {
    const procurementDetail =
      await database.imProcurementProd.supplier_order_details.findFirst({
        where: {
          supplier_item_id: detail.supplier_item_id,
          supplier_orders: {
            shop_id: detail.shop_id!,
          },
        },
      });
    if (procurementDetail) {
      await database.imInventoryProd.inventory_count_details.update({
        where: {
          id: detail.id,
        },
        data: {
          stock_category_id: procurementDetail.stock_category_id,
        },
      });
    }
  }
  console.log('Processing completed successfully');
  process.exit(0);
};

run();
