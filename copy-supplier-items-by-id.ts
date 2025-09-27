import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const fromShopId = 146;
  const toShopId = 150;

  const toShop = await database.imBasicProd.scm_shop.findUnique({
    where: {
      id: toShopId,
    },
  });

  const supplyPlanItems =
    await database.imProcurementProd.plan_item_supplier_good.findMany({
      where: {
        shop_id: fromShopId,
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

    if (!referenceId) {
      continue;
    }

    const shortReferenceId = referenceId.split('-');
    if (shortReferenceId.length < 3) {
      continue;
    }

    const referenceIdWCity = `${shortReferenceId[0]}-${toShop?.client_tier_id}-${shortReferenceId[2]}-${toShop?.city_id}`;
    console.log(referenceIdWCity);

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
            shop_id: toShopId,
          },
        },
        create: {
          plan_item_id: item.plan_item_id!,
          shop_id: toShopId,
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
