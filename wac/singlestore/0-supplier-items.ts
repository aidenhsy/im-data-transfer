import { PrismaClient as ImProcurement } from '../../prisma/clients/im-procurement-prod';
import { PrismaClient as ImInventory } from '../../prisma/clients/im-inventory-prod';

const run = async () => {
  const imProcurement = new ImProcurement();
  const imInventory = new ImInventory();

  const supplierItems = await imProcurement.supplier_items.findMany();

  for (const item of supplierItems) {
    await imInventory.supplier_items.upsert({
      where: {
        id: item.id,
      },
      update: {
        ...item,
      },
      create: {
        ...item,
      },
    });
  }
  const genericItems = await imProcurement.generic_items.findMany();

  for (const item of genericItems) {
    await imInventory.generic_items.upsert({
      where: {
        id: item.id,
      },
      update: {
        ...item,
      },
      create: {
        ...item,
      },
    });
  }
};

run();
