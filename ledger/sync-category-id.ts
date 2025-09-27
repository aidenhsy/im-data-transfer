import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const supplierItems =
    await database.imProcurementProd.supplier_items.findMany({
      where: {
        supplier_item_category_id: null,
      },
    });

  for (const item of supplierItems) {
    const good = await database.scmProd.scm_goods.findUnique({
      where: {
        id: Number(item.supplier_reference_id?.split('-')[2]),
      },
    });

    await database.imProcurementProd.supplier_items.update({
      where: {
        id: item.id,
      },
      data: {
        supplier_item_category_id: good?.category_id,
      },
    });
  }
};

run();
