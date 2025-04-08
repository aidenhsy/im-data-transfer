import { PrismaClient  as ImClient } from '../prisma/clients/im';

const run = async () => {
  const prisma = new ImClient();

  const ingredients = await prisma.st_ingredient.findMany({
    include: {
      scm_supply_plan_scm_goods: true,
    },
  });

  for (const ingredient of ingredients) {
    await prisma.st_ingredient.update({
      where: {
        id: ingredient.id,
      },
      data: {
        good_unit_id: ingredient.scm_supply_plan_scm_goods?.base_unit_id,
      },
    });
  }

  const countItems = await prisma.st_daily_count_items.findMany({
    include: {
      scm_supply_plan_scm_goods: true,
    },
  });

  for (const countItem of countItems) {
    await prisma.st_daily_count_items.update({
      where: {
        id: countItem.id,
      },
      data: {
        unit_id: countItem.scm_supply_plan_scm_goods?.base_unit_id,
      },
    });
  }
};

run();
