import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const details =
    await database.imInventoryProd.inventory_count_details.findMany({
      where: {
        generic_item_id: null,
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
        select: {
          item_id: true,
        },
      });
    if (procurementDetail) {
      console.log(procurementDetail.item_id);
      await database.imInventoryProd.inventory_count_details.update({
        where: {
          id: detail.id,
        },
        data: {
          generic_item_id: procurementDetail.item_id,
        },
      });
    }
  }
};

run();
