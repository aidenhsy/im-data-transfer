import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const supplierItems =
    await database.imProcurementProd.supplier_items.findMany({
      select: {
        id: true,
        supplier_reference_id: true,
      },
    });

  for (const item of supplierItems) {
    const unit = item.supplier_reference_id;
    const parts = unit?.split('-');
    const unitId = parts?.slice(4).join('-');

    const scmUnit = await database.scmProd.scm_good_units.findUnique({
      where: {
        id: unitId,
      },
    });

    if (!scmUnit) {
      console.log(unitId);
      continue;
    }

    await database.imProcurementProd.supplier_item_units.upsert({
      where: {
        id: scmUnit.id,
      },
      update: {
        supplier_item_id: item.id,
        name: scmUnit.name!,
        ratio_to_base: scmUnit.ratio_to_base,
      },
      create: {
        id: scmUnit.id,
        supplier_item_id: item.id,
        name: scmUnit.name!,
        ratio_to_base: scmUnit.ratio_to_base,
      },
    });
  }
};

run();
