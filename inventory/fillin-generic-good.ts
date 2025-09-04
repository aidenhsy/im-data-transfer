import { DatabaseService } from '../database';

const run = async () => {
  const databaseService = new DatabaseService();

  const countDetails =
    await databaseService.imInventoryDev.inventory_count_details.findMany({
      select: {
        id: true,
        supplier_item_id: true,
        shop_id: true,
      },
    });

  for (const countDetail of countDetails) {
    const planItemSupplierGood =
      await databaseService.imProcurementProd.supplier_order_details.findFirst({
        where: {
          supplier_item_id: countDetail.supplier_item_id,
          supplier_orders: {
            shop_id: countDetail.shop_id!,
          },
        },
        select: {
          item_id: true,
        },
      });

    if (!planItemSupplierGood) {
      console.log('planItemSupplierGood not found');
      continue;
    }

    await databaseService.imInventoryDev.inventory_count_details.update({
      where: {
        id: countDetail.id,
      },
      data: {
        generic_item_id: planItemSupplierGood.item_id,
      },
    });
  }
};

run();
