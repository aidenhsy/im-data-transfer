import { DatabaseLocalService } from '../database-local';

const run = async () => {
  const database = new DatabaseLocalService();

  const supplierItems =
    await database.imInventoryLocal.shop_item_weighted_price.findMany({
      distinct: ['supplier_item_id', 'shop_id'],
      select: {
        supplier_item_id: true,
        shop_id: true,
      },
    });
  const interval = 1000;
  let index = 0;
  console.log(supplierItems.length);
  for (const detail of supplierItems) {
    if (index % interval === 0) {
      console.log(`Processing ${index} of ${supplierItems.length}`);
    }
    index++;
    const lastOrder =
      await database.imProcurementProd.supplier_order_details.findFirst({
        where: {
          supplier_item_id: detail.supplier_item_id,
          supplier_orders: {
            shop_id: detail.shop_id!,
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

    const weightedPriceData = await database.imInventoryLocal.$queryRaw<
      any[]
    >`select *
      from v_shop_item_current
      where supplier_item_id = ${detail.supplier_item_id}
        and shop_id = ${detail.shop_id};`;
    const basePrice =
      Number(lastOrder?.price) / Number(lastOrder?.package_unit_to_base_ratio);

    const weightedPrice = Number(weightedPriceData[0].current_avg_cost_base);

    // Check if the difference is above 10% of basePrice
    if (basePrice && weightedPrice) {
      const difference = Math.abs(weightedPrice - basePrice);
      const tenPercentOfBase = basePrice * 0.1;
      const isAboveTolerance = difference > tenPercentOfBase;

      // Only log if difference is above 10%
      if (isAboveTolerance) {
        const percentageDifference = (difference / basePrice) * 100;

        console.log(`Supplier Item ID: ${detail.supplier_item_id}`);
        console.log(`Shop ID: ${detail.shop_id}`);
        console.log(`Base Price: ${basePrice.toFixed(4)}`);
        console.log(`Weighted Price: ${weightedPrice.toFixed(4)}`);
        console.log(`Difference: ${difference.toFixed(4)}`);
        console.log(
          `Percentage Difference: ${percentageDifference.toFixed(2)}%`
        );
        console.log('---');
      }
    }
  }
};

run();
