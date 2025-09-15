import { DatabaseService } from '../database';

const run = async () => {
  const databaseService = new DatabaseService();
  const supplierItems =
    await databaseService.imProcurementProd.supplier_items.findMany();

  for (const item of supplierItems) {
    await databaseService.imInventoryLocal.supplier_items.upsert({
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
  const genericItems =
    await databaseService.imProcurementProd.generic_items.findMany();

  for (const item of genericItems) {
    await databaseService.imInventoryLocal.generic_items.upsert({
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
