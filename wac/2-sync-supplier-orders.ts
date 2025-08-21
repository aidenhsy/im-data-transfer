import { PrismaClient as ImInventory } from '../prisma/clients/im-inventory-prod';
import { PrismaClient as ImProcurement } from '../prisma/clients/im-procurement-prod';

const run = async () => {
  const imInventory = new ImInventory();
  const imProcurement = new ImProcurement();

  const inventories = await imInventory.inventory_count.findMany({
    distinct: ['shop_id'],
    orderBy: {
      created_at: 'asc',
    },
    where: {
      created_at: {
        gte: new Date('2025-06-15'),
      },
    },
    include: {
      inventory_count_details: {
        include: {
          supplier_items: true,
        },
      },
    },
  });

  for (const inventory of inventories) {
    for (const inventoryDetail of inventory.inventory_count_details) {
      await imInventory.shop_item_weighted_price.create({
        data: {
          shop_id: Number(inventory.shop_id),
          supplier_item_id: inventoryDetail.supplier_items.id,
          total_qty: inventoryDetail.count_qty,
          total_value:
            Number(inventoryDetail.count_qty) *
            Number(inventoryDetail.supplier_items.price),
          source_id: inventory.id,
          source_detail_id: inventoryDetail.id,
          type: 'stock_count',
          status: 1,
          order_to_base_factor: Number(
            inventoryDetail.supplier_items.package_unit_to_base_ratio
          ),
        },
      });
    }
  }
};

run();
