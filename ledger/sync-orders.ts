import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const BATCH_SIZE = 10000;
  let skip = 0;
  let totalProcessed = 0;
  let hasMore = true;

  console.log('Starting batch processing...');

  while (hasMore) {
    console.log(
      `Starting batch ${
        Math.floor(skip / BATCH_SIZE) + 1
      }, processing records ${skip + 1} to ${skip + BATCH_SIZE}...`
    );

    const orderDetails =
      await database.imProcurementProd.supplier_order_details.findMany({
        skip,
        take: BATCH_SIZE,
        where: {
          supplier_orders: {
            status: {
              in: [4, 5],
            },
          },
        },
        orderBy: { id: 'asc' }, // Essential for consistent pagination
        select: {
          id: true,
          order_id: true,
          actual_delivery_qty: true,
          supplier_item_id: true,
          supplier_item_name: true,
          stock_category_id: true,
          package_unit_name: true,
          package_unit_to_base_ratio: true,
          total_delivery_amount: true,
          price: true,
          stock_category: {
            select: {
              name: true,
            },
          },
          generic_items: {
            select: {
              id: true,
              name: true,
              category_id: true,
              scm_goods_category: {
                select: {
                  name: true,
                },
              },
            },
          },
          supplier_orders: {
            select: {
              shop_id: true,
              receive_time: true,
              scm_shop: {
                select: {
                  big_org_id: true,
                  brand_id: true,
                },
              },
            },
          },
        },
      });

    if (orderDetails.length === 0) {
      hasMore = false;
      continue;
    }

    // Process current batch
    for (const detail of orderDetails) {
      await database.imAccountingProd.inventory_ledger.create({
        data: {
          biz_type_id: 1,
          source_id: detail.order_id,
          source_detail_id: detail.id,
          shop_id: Number(detail.supplier_orders.shop_id),
          brand_id: detail.supplier_orders.scm_shop.brand_id,
          org_id: detail.supplier_orders.scm_shop.big_org_id!,
          supplier_item_id: detail.supplier_item_id!,
          supplier_item_name: detail.supplier_item_name!,
          generic_item_id: detail.generic_items.id,
          generic_item_name: detail.generic_items.name,
          category_id: detail.generic_items.category_id,
          category_name: detail.generic_items.scm_goods_category.name,
          stock_id: detail.stock_category_id,
          stock_name: detail.stock_category?.name,
          base_unit_qty:
            Number(detail.actual_delivery_qty) *
            Number(detail.package_unit_to_base_ratio),
          base_unit: detail.package_unit_name,
          package_unit_qty: Number(detail.actual_delivery_qty),
          package_unit: detail.package_unit_name,
          price: Number(detail.price),
          total_value: Number(detail.total_delivery_amount),
          created_at: detail.supplier_orders.receive_time!,
          updated_at: detail.supplier_orders.receive_time!,
        },
      });
    }

    totalProcessed += orderDetails.length;
    skip += BATCH_SIZE;

    console.log(
      `Processed batch: ${orderDetails.length} records | Total processed: ${totalProcessed}`
    );

    // If we got fewer records than the batch size, we've reached the end
    if (orderDetails.length < BATCH_SIZE) {
      hasMore = false;
    }
  }

  console.log(`Completed! Total records processed: ${totalProcessed}`);
};

run();
