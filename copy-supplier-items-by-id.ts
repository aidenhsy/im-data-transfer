import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const fromShop = 143;
  const toShop = 147;

  const supplyPlanItems =
    await database.imProcurementProd.plan_item_supplier_good.findMany({
      where: {
        shop_id: fromShop,
      },
      include: {
        supplier_items: true,
      },
    });

  console.log(supplyPlanItems.length);
  let length = 0;

  // 23 is city id for nanking
  for (const item of supplyPlanItems) {
    const referenceId = item.supplier_items?.supplier_reference_id;

    const shortReferenceId = referenceId?.split('-').slice(0, 3).join('-');
    const referenceIdWCity = `${shortReferenceId}-26`;

    const supplierItem =
      await database.imProcurementProd.supplier_items.findFirst({
        where: {
          supplier_reference_id: {
            startsWith: referenceIdWCity,
          },
        },
      });

    if (supplierItem) {
      await database.imProcurementProd.plan_item_supplier_good.upsert({
        where: {
          plan_item_id_shop_id: {
            plan_item_id: item.plan_item_id!,
            shop_id: toShop,
          },
        },
        create: {
          plan_item_id: item.plan_item_id!,
          shop_id: toShop,
          supplier_item_id: supplierItem.id,
        },
        update: {
          supplier_item_id: supplierItem.id,
        },
      });
      length++;
    }
  }

  console.log(length);
  console.log('done');
  process.exit(0);
};

run();
