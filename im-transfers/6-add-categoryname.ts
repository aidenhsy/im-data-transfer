import { PrismaClient } from '@prisma/client';

const run = async () => {
  const prisma = new PrismaClient();

  const scmGoods = await prisma.scm_supply_plan_scm_goods.findMany({
    include: {
      scm_goods: {
        include: {
          scm_goods_category: true,
        },
      },
    },
  });

  for (const item of scmGoods) {
    await prisma.scm_supply_plan_scm_goods.update({
      where: {
        id: item.id,
      },
      data: {
        category_name: item.scm_goods?.scm_goods_category?.name,
      },
    });
  }
};

run();
