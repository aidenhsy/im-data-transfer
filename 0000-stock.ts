import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const imProcurement =
    await database.imProcurementProd.supplier_order_details.findMany({
      select: {
        id: true,
        item_id: true,
        supplier_orders: {
          select: {
            shop_id: true,
            scm_shop: {
              select: {
                scm_shop_brand: {
                  select: {
                    supply_plan_id: true,
                  },
                },
              },
            },
          },
        },
      },
      where: {
        stock_category_id: null,
      },
    });
  console.log(imProcurement.length);

  let count = 0;
  for (const item of imProcurement) {
    const planItem =
      await database.imProcurementProd.supply_plan_items.findFirst({
        where: {
          // supply_plan_id:
          //   item.supplier_orders.scm_shop.scm_shop_brand.supply_plan_id,
          item_id: item.item_id,
        },
      });

    if (planItem) {
      count++;
      await database.imProcurementProd.supplier_order_details.update({
        where: {
          id: item.id,
        },
        data: {
          stock_category_id: planItem.stock_category_id,
        },
      });
    }
  }

  console.log('Processing completed successfully', count);
  await database.disconnect();
  process.exit(0);
};

run();
