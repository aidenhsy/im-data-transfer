import { DatabaseLocalService } from '../database-local';

const run = async () => {
  const database = new DatabaseLocalService();
  await database.connect();

  const orderDetail =
    await database.imProcurementProd.supplier_order_details.findFirst({
      where: {
        supplier_item_id: 'a6d36a80-1cde-4282-86a5-8a47227f7359',
      },
      include: {
        supplier_orders: true,
      },
    });

  await database.imInventoryLocal.shop_item_weighted_price.create({
    data: {
      shop_id: orderDetail?.supplier_orders.shop_id!,
      supplier_item_id: orderDetail?.supplier_item_id!,
      total_qty: orderDetail?.final_qty,
      total_value: orderDetail?.total_final_amount,
      source_id: orderDetail?.order_id,
      source_detail_id: orderDetail?.id,
      type: 'order_in',
      status: 1,
      order_to_base_factor: orderDetail?.package_unit_to_base_ratio!,
      generic_item_id: orderDetail?.item_id,
      stock_category_id: orderDetail?.stock_category_id,
    },
  });
};

run();
