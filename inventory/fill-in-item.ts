import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const details =
    await database.imProcurementProd.supplier_order_details.findMany({
      include: {
        supplier_items: {
          select: {
            standard_units: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      where: {
        supplier_orders: {
          shop_id: 30,
          receive_time: {
            gte: new Date('2025-09-01T00:00:00.000Z'),
          },
        },
      },
      distinct: ['supplier_item_id'],
    });

  const inventory =
    await database.imInventoryProd.inventory_count_details.findMany({
      where: {
        inventory_count_id: '48fa07a9-89d8-4271-b8a5-1f89607b6178',
      },
    });

  for (const detail of details) {
    const inventoryDetail = inventory.find(
      (i) => i.supplier_item_id === detail.supplier_item_id
    );
    if (!inventoryDetail) {
      await database.imInventoryProd.inventory_count_details.create({
        data: {
          weighted_price: detail.price,
          supplier_item_id: detail.supplier_item_id!,
          generic_item_id: detail.item_id,
          inventory_count_id: '48fa07a9-89d8-4271-b8a5-1f89607b6178',
          shop_id: 30,
          stock_category_id: detail.stock_category_id,
          count_unit: detail.package_unit_name,
          base_qty_per_count: detail.package_unit_to_base_ratio,
          base_unit: detail.supplier_items?.standard_units?.name,
          is_count: false,
          balance_qty: 400,
        },
      });
      console.log(detail.supplier_item_id);
    }
  }
};

run();
