import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();
  await database.connect();

  const orders = await database.imProcurementProd.supplier_orders.findMany({
    orderBy: {
      receive_time: 'asc',
    },
    where: {
      receive_time: {
        gt: new Date('2025-08-01T00:00:00.000Z'),
        lt: new Date('2025-08-31T23:59:59.999Z'),
      },
      status: {
        in: [4, 5],
      },
    },
    include: {
      supplier_order_details: {
        include: {
          supplier_items: true,
        },
      },
    },
  });

  for (const order of orders) {
    for (const detail of order.supplier_order_details) {
      await database.imInventoryProd.shop_item_weighted_price.create({
        data: {
          shop_id: order.shop_id,
          supplier_item_id: detail.supplier_item_id!,
          total_qty: detail.final_qty,
          total_value: detail.total_final_amount,
          source_id: order.id,
          source_detail_id: detail.id,
          type: 'order_in',
          created_at: order.receive_time!,
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
