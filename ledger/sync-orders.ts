import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const orderDetails =
    await database.imProcurementProd.supplier_order_details.findMany({
      select: {
        id: true,
        order_id: true,
        supplier_item_id: true,
        supplier_item_name: true,
        stock_category_id: true,
        final_qty: true,
        package_unit_name: true,
        package_unit_to_base_ratio: true,
        price: true,
        total_final_amount: true,
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

  for (const detail of orderDetails) {
    await database.imAccountingProd.inventory_ledger.create({
      data: {
        biz_type_id: 1,
        source_id: detail.order_id,
        source_detail_id: detail.id,
        shop_id: detail.supplier_orders.shop_id,
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
          Number(detail.final_qty) * Number(detail.package_unit_to_base_ratio),
        base_unit: detail.package_unit_name,
        package_unit_qty: Number(detail.final_qty),
        package_unit: detail.package_unit_name,
        price: Number(detail.price),
        total_value: Number(detail.total_final_amount),
        created_at: detail.supplier_orders.receive_time!,
        updated_at: detail.supplier_orders.receive_time!,
      },
    });
  }
};

run();
