import { PrismaClient as ImProd } from '../prisma/clients/im-prod';
import { PrismaClient as ImProcurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as ImInventory } from '../prisma/clients/im-inventory-prod';

const run = async () => {
  const procurement = new ImProcurement();
  const inventory = new ImInventory();

  const procurementSupplierItems = await procurement.supplier_items.findMany();

  const inventorySupplierItems = await inventory.supplier_items.findMany();

  const missingInventorySupplierItems = procurementSupplierItems.filter(
    (item) =>
      !inventorySupplierItems.some((i) => i.supplier_id === item.supplier_id)
  );

  if (missingInventorySupplierItems.length > 0) {
    console.log(
      `Missing inventory supplier items: ${missingInventorySupplierItems.length}`
    );

    for (const item of missingInventorySupplierItems) {
      await inventory.supplier_items.create({
        data: item,
      });
    }
  }
};

run();
