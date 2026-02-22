import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const goods = await database.imBasicProd.generic_items.findMany();

  const procurementGoods =
    await database.imProcurementProd.generic_items.findMany();

  if (goods.length > procurementGoods.length) {
    // Create a Set of procurement goods IDs for efficient lookup
    const procurementGoodsIds = new Set(procurementGoods.map((g) => g.id));

    // Find goods that are not in procurementGoods
    const missingGoods = goods.filter((g) => !procurementGoodsIds.has(g.id));

    console.log(
      `Found ${missingGoods.length} goods in goods but not in procurementGoods:`,
    );
    console.log(
      'Missing good IDs:',
      missingGoods.map((g) => g.id),
    );
    for (const good of missingGoods) {
      await database.imProcurementProd.generic_items.create({
        data: {
          ...good,
        },
      });
    }
  }
};

run();
