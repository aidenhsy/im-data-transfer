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
      },
    });

  for (const detail of details) {
    const planItem =
      await database.imProcurementProd.plan_item_supplier_good.findFirst({
        where: {
          supplier_item_id: detail.supplier_item_id,
        },
        select: {
          supply_plan_items: {
            select: {
              item_id: true,
            },
          },
        },
      });

    if (!planItem) {
      continue;
    }

    await database.imInventoryProd.inventory_count_details.update({
      where: { id: detail.id },
      data: {
        generic_item_id: planItem.supply_plan_items?.item_id,
      },
    });
  }
};
