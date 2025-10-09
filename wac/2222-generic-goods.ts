import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const countDetails =
    await database.imInventoryProd.inventory_count_details.findMany({
      where: {
        inventory_count_id: '21c7eb55-9f36-4298-9c94-cd1dcab87c5f',
      },
    });
  console.log(countDetails.length);

  for (const detail of countDetails) {
    const weightedPrice = await database.imInventoryProd.$queryRaw<any[]>`
   select *
from v_shop_item_current
where supplier_item_id = ${detail.supplier_item_id}
  and shop_id = 134; 
    `;
    if (weightedPrice.length > 0) {
      const weightedPriceData = weightedPrice[0];
      if (
        isNaN(weightedPriceData.current_avg_cost_base) ||
        !weightedPriceData.current_avg_cost_base
      ) {
        continue;
      }
      await database.imInventoryProd.inventory_count_details.update({
        where: {
          id: detail.id,
        },
        data: {
          weighted_price: weightedPriceData.current_avg_cost_base,
        },
      });
    }
  }
  const newDetails =
    await database.imInventoryProd.inventory_count_details.findMany({
      where: {
        inventory_count_id: '21c7eb55-9f36-4298-9c94-cd1dcab87c5f',
      },
    });
  const newTotoal = newDetails.reduce(
    (acc, curr) => acc + Number(curr.count_value),
    0
  );
  await database.imInventoryProd.inventory_count.update({
    where: {
      id: '21c7eb55-9f36-4298-9c94-cd1dcab87c5f',
    },
    data: {
      count_amount: newTotoal,
    },
  });
  console.log(newTotoal);
  process.exit(0);
};

run();
