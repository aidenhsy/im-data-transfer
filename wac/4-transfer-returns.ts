import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();
  await database.connect();

  const orders =
    await database.imProcurementProd.supplier_order_returns.findMany({
      orderBy: {
        created_at: 'asc',
      },
      where: {
        status: 1,
      },
      include: {
        supplier_order_return_details: {
          include: {
            supplier_items: true,
          },
        },
      },
    });

  for (const order of orders) {
    for (const detail of order.supplier_order_return_details) {
      await database.imInventoryProd.shop_item_weighted_price.create({
        data: {
          shop_id: order.shop_id,
          supplier_item_id: detail.supplier_item_id!,
          total_qty: -Number(detail.qty_returned),
          total_value: -Number(detail.total_value),
          source_id: order.id,
          source_detail_id: detail.id,
          type: 'order_return',
          created_at: order.created_at!,
          status: 1,
          order_to_base_factor: Number(
            detail.supplier_items?.package_unit_to_base_ratio
          ),
        },
      });
    }
  }

  console.log('Processing completed successfully');
  await database.disconnect();
  process.exit(0);
};

run();
