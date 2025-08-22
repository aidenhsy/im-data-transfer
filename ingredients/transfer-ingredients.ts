import { PrismaClient as ImBasicData } from '../prisma/clients/im-basic-data-prod';
import { PrismaClient as ImProd } from '../prisma/clients/im-prod';

const run = async () => {
  const imBasicData = new ImBasicData();
  const imProd = new ImProd();

  const ingredients = await imProd.st_ingredient.findMany();

  for (const ingredient of ingredients) {
    if (ingredient.goods_id === null) {
      console.log(`Ingredient ${ingredient.id} has no goods_id`);
      continue;
    }

    const genericItem = await imBasicData.generic_items.findUnique({
      where: {
        id: ingredient.goods_id!,
      },
    });

    if (!genericItem) {
      console.log(`Generic item not found for ingredient ${ingredient.id}`);
      continue;
    }

    await imBasicData.ingredient.create({
      data: {
        id: ingredient.id.toString(),
        food_item_id: ingredient.food_item_id!.toString(),
        generic_item_id: ingredient.goods_id!,
        qty: ingredient.qty,
        base_unit_id: genericItem.base_unit_id,
        yield_pct: ingredient.yield_pct,
      },
    });
  }
};

run();
