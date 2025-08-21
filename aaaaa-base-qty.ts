import { PrismaClient as ImInventory } from './prisma/clients/im-inventory-prod';

const run = async () => {
  const imInventory = new ImInventory();

  const inventories = await imInventory.inventory_count_details.findMany({
    select: {
      id: true,
      inventory_count: {
        select: {
          shop_id: true,
        },
      },
      supplier_items: {
        select: {
          package_unit_to_base_ratio: true,
          package_unit_name: true,
        },
      },
    },
  });

  for (const inventory of inventories) {
    await imInventory.inventory_count_details.update({
      where: { id: inventory.id },
      data: {
        base_qty_per_count: Number(
          inventory.supplier_items.package_unit_to_base_ratio
        ),
        count_unit: inventory.supplier_items.package_unit_name,
        shop_id: inventory.inventory_count.shop_id,
      },
    });
  }
};

run();
