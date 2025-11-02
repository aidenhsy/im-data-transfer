import { DatabaseService } from './database';

const checkInventoryUnits = async () => {
  const database = new DatabaseService();

  const inventoryCountDetails =
    await database.imInventoryProd.inventory_count_details.findMany({
      where: {
        inventory_count: {
          created_at: {
            gte: new Date('2025-10-31T00:00:00.000Z'),
          },
        },
      },
      select: {
        id: true,
        count_unit: true,
      },
    });
  console.log(inventoryCountDetails.length);
  for (const inventoryCountDetail of inventoryCountDetails) {
    const inventoryCountCount =
      await database.imInventoryProd.inventory_count_counts.findFirst({
        where: {
          inventory_count_detail_id: inventoryCountDetail.id,
        },
      });
    if (
      inventoryCountCount &&
      inventoryCountCount.unit_name !== inventoryCountDetail.count_unit
    ) {
      console.log(
        inventoryCountDetail.id,
        inventoryCountCount.unit_name,
        inventoryCountDetail.count_unit
      );
    }
  }
};

checkInventoryUnits();
