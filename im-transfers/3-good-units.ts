import { PrismaClient } from '@prisma/client';

const run = async () => {
  const prisma = new PrismaClient();

  const scmGoods = await prisma.scm_supply_plan_scm_goods.findMany({
    include: {
      scm_goods: {
        include: {
          scm_good_units_scm_goods_base_good_unit_idToscm_good_units: true,
          scm_good_units_scm_goods_order_good_unit_idToscm_good_units: true,
        },
      },
    },
  });

  console.log(scmGoods.length);
  const totalLength = scmGoods.length;
  let index = 0;
  await prisma.scm_good_units.deleteMany({
    where: {
      goods_id: null,
    },
  });

  for (const item of scmGoods) {
    console.log(`Processing ${index++} of ${totalLength}`);
    const newBaseUnit = await prisma.scm_good_units.create({
      data: {
        supply_plan_goods_id: item.id,
        ratio_to_base:
          item.scm_goods
            ?.scm_good_units_scm_goods_base_good_unit_idToscm_good_units
            ?.ratio_to_base!,
        name: item.scm_goods
          ?.scm_good_units_scm_goods_base_good_unit_idToscm_good_units?.name,
      },
    });

    const newOrderUnit = await prisma.scm_good_units.create({
      data: {
        supply_plan_goods_id: item.id,
        ratio_to_base:
          item.scm_goods
            ?.scm_good_units_scm_goods_order_good_unit_idToscm_good_units
            ?.ratio_to_base!,
        name: item.scm_goods
          ?.scm_good_units_scm_goods_order_good_unit_idToscm_good_units?.name,
      },
    });

    await prisma.scm_supply_plan_scm_goods.update({
      where: {
        id: item.id,
      },
      data: {
        base_unit_id: newBaseUnit.id,
        base_unit: newBaseUnit.name,
        order_unit_id: newOrderUnit.id,
        order_unit: newOrderUnit.name,
        order_to_base_ratio: newOrderUnit.ratio_to_base,
        goods_name: item.scm_goods?.name,
      },
    });
  }
};

run();
