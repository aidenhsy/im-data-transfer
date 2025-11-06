import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const details =
    await database.imInventoryProd.inventory_count_details.findMany({
      select: {
        supplier_item_id: true,
        weighted_price: true,
        inventory_count_id: true,
        inventory_count: {
          select: {
            shop_id: true,
          },
        },
      },
      where: {
        inventory_count: {
          created_at: {
            gt: new Date('2025-10-31T00:00:00.000Z'),
          },
          shop_id: {
            in: [29, 147, 118, 140, 44, 35],
          },
        },
      },
    });

  for (const detail of details) {
    const lastOrder =
      await database.imProcurementProd.supplier_order_details.findFirst({
        where: {
          supplier_item_id: detail.supplier_item_id,
          supplier_orders: {
            shop_id: detail.inventory_count.shop_id!,
          },
        },
      });
    if (!lastOrder) {
      continue;
    }
    const lastWeightedPrice =
      Number(lastOrder.price) / Number(lastOrder.package_unit_to_base_ratio);
    const diff = Number(detail.weighted_price) - Number(lastWeightedPrice);
    if (
      Math.abs(lastWeightedPrice) > 0 &&
      Math.abs(diff) / Math.abs(lastWeightedPrice) > 0.1
    ) {
      console.log(
        `last: ${lastWeightedPrice}, count: ${detail.weighted_price}`
      );
    }
  }
};

run();
