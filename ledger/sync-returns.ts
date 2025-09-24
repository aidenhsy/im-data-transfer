import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const returns =
    await database.imProcurementProd.supplier_order_return_details.findMany({
      where: {
        supplier_order_returns: {
          status: 1,
        },
      },
      include: {
        supplier_items: true,
        supplier_order_details: {
          include: {
            stock_category: true,
            generic_items: {
              include: {
                scm_goods_category: true,
              },
            },
          },
        },
        supplier_order_returns: {
          include: {
            scm_shop: true,
          },
        },
      },
    });
  for (const item of returns) {
    await database.imAccountingProd.inventory_ledger.upsert({
      where: {
        source_id_source_detail_id: {
          source_id: item.return_id,
          source_detail_id: item.id,
        },
      },
      update: {},
      create: {
        biz_type_id: 2,
        source_id: item.return_id,
        source_detail_id: item.id,
        shop_id: item.supplier_order_returns.scm_shop.id,
        brand_id: item.supplier_order_returns.scm_shop.brand_id,
        org_id: item.supplier_order_returns.scm_shop.big_org_id!,
        supplier_item_id: item.supplier_item_id,
        supplier_item_name: item.supplier_items.name,
        generic_item_id: item.supplier_order_details.item_id,
        generic_item_name: item.supplier_order_details.generic_items.name,
        category_id: item.supplier_order_details.generic_items.category_id,
        category_name:
          item.supplier_order_details.generic_items.scm_goods_category.name,
        stock_id: item.supplier_order_details.stock_category_id,
        stock_name: item.supplier_order_details.stock_category?.name,
        base_unit_qty:
          -Number(item.qty_returned) *
          Number(item.supplier_order_details.package_unit_to_base_ratio),
        base_unit: item.supplier_order_details.package_unit_name,
        package_unit_qty: -item.qty_returned,
        package_unit: item.supplier_order_details.package_unit_name,
        price: item.unit_price,
        total_value: -item.total_value!,
        created_at: item.supplier_order_returns.updated_at!,
        updated_at: item.supplier_order_returns.updated_at!,
      },
    });
  }
};

run();
