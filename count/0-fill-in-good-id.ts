import { PrismaClient as ImProd } from '../prisma/clients/im-prod';
import { PrismaClient as ImProcurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as ImInventory } from '../prisma/clients/im-inventory-prod';

const run = async () => {
  const procurement = new ImProcurement();
  const inventory = new ImInventory();

  const procurementSupplierItems = await procurement.supplier_items.findMany();
  console.log('Procurement supplier items:', procurementSupplierItems.length);

  const inventorySupplierItems = await inventory.supplier_items.findMany();
  console.log('Inventory supplier items:', inventorySupplierItems.length);

  // Debug: Let's see some sample data
  console.log('Sample procurement item:', procurementSupplierItems[0]);
  console.log('Sample inventory item:', inventorySupplierItems[0]);

  const missingInventorySupplierItems = procurementSupplierItems.filter(
    (item) => !inventorySupplierItems.some((i) => i.id === item.id.toString())
  );

  console.log('Missing items found:', missingInventorySupplierItems.length);

  if (missingInventorySupplierItems.length > 0) {
    console.log(
      `Missing inventory supplier items: ${missingInventorySupplierItems.length}`
    );

    for (const item of missingInventorySupplierItems) {
      await inventory.supplier_items.create({
        data: item,
      });
    }
  } else {
    console.log(
      'No missing items found - all procurement items already exist in inventory'
    );
  }
};

run();
