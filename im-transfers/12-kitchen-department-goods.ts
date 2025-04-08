import { PrismaClient  as ImClient } from '../prisma/clients/im';

const run = async () => {
  const prisma = new ImClient();

  const kitchenDepartmentGoods =
    await prisma.st_kitchen_department_goods.findMany({
      include: {
        st_kitchen_department: true,
      },
    });

  const length = kitchenDepartmentGoods.length;
  let count = 0;
  for (const kitchenDepartmentGood of kitchenDepartmentGoods) {
    console.log(`${count++}/${length}`);
    const shop = await prisma.scm_shop.findFirst({
      where: {
        id: kitchenDepartmentGood.st_kitchen_department?.shop_id!,
      },
    });

    const spg = await prisma.scm_supply_plan_scm_goods.findFirst({
      where: {
        good_id: kitchenDepartmentGood.goods_id!,
        supply_plan_id: shop?.supply_plan_id!,
      },
    });

    if (!spg) {
      await prisma.st_kitchen_department_goods.delete({
        where: {
          id: kitchenDepartmentGood.id,
        },
      });
      continue;
    }

    await prisma.st_kitchen_department_goods.update({
      where: {
        id: kitchenDepartmentGood.id,
      },
      data: {
        spg_id: spg.id,
      },
    });
  }
};

run();
