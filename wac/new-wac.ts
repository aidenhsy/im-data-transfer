import { DatabaseService } from '../database';

const rundelivery = async () => {
  const database = new DatabaseService();

  const details =
    await database.imProcurementProd.supplier_order_details.findMany({
      where: {
        supplier_orders: {
          status: 4,
          receive_time: {
            gte: new Date('2025-10-01T00:00:00.000Z'),
          },
        },
      },
      select: {
        supplier_orders: {
          select: {
            shop_id: true,
          },
        },
        id: true,
        order_id: true,
        supplier_item_id: true,
        confirm_delivery_qty: true,
        total_delivery_amount: true,
        package_unit_to_base_ratio: true,
        item_id: true,
        stock_category_id: true,
      },
      orderBy: {
        supplier_orders: {
          receive_time: 'asc',
        },
      },
    });

  const length = details.length;
  console.log(length);

  for (const detail of details) {
    await database.imInventoryProd.shop_item_weighted_price.create({
      data: {
        shop_id: detail.supplier_orders.shop_id,
        source_id: detail.order_id,
        source_detail_id: detail.id,
        supplier_item_id: detail.supplier_item_id!,
        total_qty: detail.confirm_delivery_qty,
        total_value: detail.total_delivery_amount,
        type: 'order_in',
        status: 1,
        order_to_base_factor: detail.package_unit_to_base_ratio,
        generic_item_id: detail.item_id,
        stock_category_id: detail.stock_category_id,
      },
    });
  }
};

// rundelivery();

const runReturns = async () => {
  const database = new DatabaseService();

  const details =
    await database.imProcurementProd.supplier_order_return_details.findMany({
      where: {
        status: 1,
        supplier_order_returns: {
          supplier_orders: {
            receive_time: {
              gte: new Date('2025-10-01T00:00:00.000Z'),
            },
          },
        },
      },
      select: {
        id: true,
        return_id: true,
        qty_returned: true,
        total_value: true,
        supplier_item_id: true,
        supplier_items: true,
        supplier_order_details: {
          select: {
            stock_category_id: true,
            item_id: true,
          },
        },
        supplier_order_returns: {
          select: {
            shop_id: true,
          },
        },
      },
    });

  for (const detail of details) {
    await database.imInventoryProd.shop_item_weighted_price.create({
      data: {
        shop_id: detail.supplier_order_returns.shop_id,
        source_id: detail.return_id,
        source_detail_id: detail.id,
        supplier_item_id: detail.supplier_item_id!,
        total_qty: -Number(detail.qty_returned),
        total_value: -Number(detail.total_value),
        type: 'order_return',
        status: 1,
        order_to_base_factor: detail.supplier_items.package_unit_to_base_ratio!,
        generic_item_id: detail.supplier_order_details.item_id,
        stock_category_id: detail.supplier_order_details.stock_category_id,
      },
    });
  }
  console.log('Processing completed successfully');
  process.exit(0);
};

runReturns();
