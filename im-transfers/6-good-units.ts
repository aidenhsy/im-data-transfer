import { PrismaClient  as ImClient } from '../prisma/clients/im';

const run = async () => {
  const prisma = new ImClient();

  const scmGoods = await prisma.scm_supply_plan_scm_goods.findMany({
    include: {
      scm_goods: {
        include: {
          scm_good_units_scm_goods_base_good_unit_idToscm_good_units: true,
          scm_good_units_scm_goods_order_good_unit_idToscm_good_units: true,
          scm_good_units_scm_goods_count_good_unit_idToscm_good_units: true,
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
    const newBaseUnit = await prisma.scm_good_units.upsert({
      where: {
        supply_plan_goods_id_ratio_to_base: {
          supply_plan_goods_id: item.id,
          ratio_to_base:
            item.scm_goods
              ?.scm_good_units_scm_goods_base_good_unit_idToscm_good_units
              ?.ratio_to_base!,
        },
      },
      update: {},
      create: {
        supply_plan_goods_id: item.id,
        ratio_to_base:
          item.scm_goods
            ?.scm_good_units_scm_goods_base_good_unit_idToscm_good_units
            ?.ratio_to_base!,
        name: item.scm_goods
          ?.scm_good_units_scm_goods_base_good_unit_idToscm_good_units?.name,
      },
    });

    const newOrderUnit = await prisma.scm_good_units.upsert({
      where: {
        supply_plan_goods_id_ratio_to_base: {
          supply_plan_goods_id: item.id,
          ratio_to_base:
            item.scm_goods
              ?.scm_good_units_scm_goods_order_good_unit_idToscm_good_units
              ?.ratio_to_base!,
        },
      },
      update: {},
      create: {
        supply_plan_goods_id: item.id,
        ratio_to_base:
          item.scm_goods
            ?.scm_good_units_scm_goods_order_good_unit_idToscm_good_units
            ?.ratio_to_base!,
        name: item.scm_goods
          ?.scm_good_units_scm_goods_order_good_unit_idToscm_good_units?.name,
      },
    });

    const newCountUnit = await prisma.scm_good_units.upsert({
      where: {
        supply_plan_goods_id_ratio_to_base: {
          supply_plan_goods_id: item.id,
          ratio_to_base:
            item.scm_goods
              ?.scm_good_units_scm_goods_count_good_unit_idToscm_good_units
              ?.ratio_to_base!,
        },
      },
      update: {},
      create: {
        supply_plan_goods_id: item.id,
        ratio_to_base:
          item.scm_goods
            ?.scm_good_units_scm_goods_count_good_unit_idToscm_good_units
            ?.ratio_to_base!,
        name: item.scm_goods
          ?.scm_good_units_scm_goods_count_good_unit_idToscm_good_units?.name,
      },
    });

    await prisma.scm_supply_plan_scm_goods.update({
      where: {
        id: item.id,
      },
      data: {
        base_unit_id: newBaseUnit.id,
        order_unit_id: newOrderUnit.id,
        count_unit_id: newCountUnit.id,
        goods_name: item.scm_goods?.name,
      },
    });
  }

  process.exit(0);
};

run();
