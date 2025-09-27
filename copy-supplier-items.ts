import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const fromShopId = 115;
  const toShopId = 149;

  const fromShop = await database.imProcurementProd.scm_shop.findUnique({
    where: {
      id: fromShopId,
    },
    include: {
      cities: true,
    },
  });
  const toShop = await database.imProcurementProd.scm_shop.findUnique({
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
    const name = item.supplier_items?.name;

    // Remove （呼和浩特） from the name if it exists
    const cleanName = name?.replace(`（${fromShop?.cities?.name}）`, '');

    const supplierItem =
      await database.imProcurementProd.supplier_items.findFirst({
        where: {
          name: {
            contains: cleanName,
          },
          supplier_reference_id: {
            contains: `-${toShop?.city_id}-`,
          },
          tier_id: toShop?.client_tier_id!,
        },
      });

    if (supplierItem) {
      const find =
        await database.imProcurementProd.plan_item_supplier_good.findUnique({
          where: {
            plan_item_id_shop_id: {
              plan_item_id: item.plan_item_id!,
              shop_id: toShopId,
            },
          },
        });
      if (find) {
        continue;
      }
      await database.imProcurementProd.plan_item_supplier_good.upsert({
        where: {
          shop_id_supplier_item_id: {
            shop_id: toShopId,
            supplier_item_id: supplierItem.id,
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
