import { DatabaseLocalService } from '../database-local';

const run = async () => {
  const database = new DatabaseLocalService();
  await database.connect();

  const length = 10000;
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const orderDetails =
      await database.imProcurementProd.supplier_order_details.findMany({
        skip,
        take: length,
        where: {
          supplier_orders: {
            receive_time: {
              gt: new Date('2025-09-01T00:00:00.000Z'),
            },
          },
        },
        orderBy: [
          {
            created_at: 'asc',
          },
          {
            id: 'asc',
          },
        ],
        select: {
          supplier_orders: {
            select: {
              shop_id: true,
            },
          },
          supplier_item_id: true,
          final_qty: true,
          total_final_amount: true,
          order_id: true,
          id: true,
          package_unit_to_base_ratio: true,
          item_id: true,
          stock_category_id: true,
        },
      });

    if (orderDetails.length === 0) {
      hasMore = false;
      continue;
    }

    await database.imInventoryLocal.shop_item_weighted_price.createMany({
      data: orderDetails.map((orderDetail) => ({
        shop_id: orderDetail.supplier_orders.shop_id!,
        supplier_item_id: orderDetail.supplier_item_id!,
        total_qty: orderDetail.final_qty,
        total_value: orderDetail.total_final_amount,
        source_id: orderDetail.order_id,
        source_detail_id: orderDetail.id,
        type: 'order_in',
        status: 1,
        order_to_base_factor: orderDetail.package_unit_to_base_ratio!,
        generic_item_id: orderDetail.item_id,
        stock_category_id: orderDetail.stock_category_id,
      })),
    });

    skip += length;
  }
};

run();
