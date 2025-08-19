import { PrismaClient as InventoryClient } from './prisma/clients/im-inventory-prod';
import { PrismaClient as ProcurementClient } from './prisma/clients/im-procurement-prod';

const run = async () => {
  const inventoryDB = new InventoryClient();
  const procurementDB = new ProcurementClient();

  const planItems = await procurementDB.plan_item_supplier_good.findMany({
    include: {
      supplier_items: true,
    },
  });

  for (const planItem of planItems) {
    await inventoryDB.inventory_item_settings.create({
      data: {
        id: planItem.id,
        shop_id: planItem.shop_id!,
        supplier_item_id: planItem.supplier_item_id!,
        is_count: true,
        count_unit: planItem.supplier_items?.package_unit_name,
        base_qty_per_count: planItem.supplier_items?.package_unit_to_base_ratio,
      },
    });
  }
};

run();
