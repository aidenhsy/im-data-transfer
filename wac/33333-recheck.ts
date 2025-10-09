import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const monthlyAnalysis =
    await database.imAccountingProd.inventory_month_analysis.findMany({
      where: {
        month: '2025-09',
        beginning_value: {
          not: null,
        },
        ending_value: {
          not: null,
        },
      },
      select: {
        beginning_count_id: true,
        ending_count_id: true,
      },
    });

  const beginningIds = monthlyAnalysis
    .map((item) => item.beginning_count_id)
    .filter((item) => item !== null);

  const endingIds = monthlyAnalysis
    .map((item) => item.ending_count_id)
    .filter((item) => item !== null);

  const allIds = [...endingIds];

  console.log(allIds.length);

  for (const countId of allIds) {
    const countDetails =
      await database.imInventoryProd.inventory_count_details.findMany({
        where: {
          inventory_count_id: countId,
        },
        select: {
          supplier_item_id: true,
          weighted_price: true,
          inventory_count: {
            select: {
              shop_id: true,
            },
          },
        },
      });

    for (const detail of countDetails) {
      const lastOrder =
        await database.imProcurementProd.supplier_order_details.findFirst({
          where: {
            supplier_item_id: detail.supplier_item_id,
            supplier_orders: {
              shop_id: detail.inventory_count.shop_id!,
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        });

      const basePrice =
        Number(lastOrder?.price) /
        Number(lastOrder?.package_unit_to_base_ratio);

      const weightedPrice = Number(detail.weighted_price);

      // Check if the difference is above 10% of basePrice
      if (basePrice && weightedPrice) {
        const difference = Math.abs(weightedPrice - basePrice);
        const tenPercentOfBase = basePrice * 0.9;
        const isAboveTolerance = difference > tenPercentOfBase;

        // Only log if difference is above 10%
        if (isAboveTolerance) {
          const percentageDifference = (difference / basePrice) * 100;

          console.log(`Supplier Item ID: ${detail.supplier_item_id}`);
          console.log(`Shop ID: ${detail.inventory_count.shop_id}`);
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
  }
};

run();
