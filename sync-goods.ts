import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';

const run = async () => {
  const orderDb = new Order();
  const scmDb = new Scm();

  const sGoods = await scmDb.scm_goods.findMany({
    include: {
      scm_good_units_scm_goods_order_good_unit_idToscm_good_units: true,
    },
  });

  for (const sGood of sGoods) {
    await orderDb.scm_good_units.upsert({
      where: {
        id: sGood.scm_good_units_scm_goods_order_good_unit_idToscm_good_units
          ?.id,
      },
      update: {
        ...sGood.scm_good_units_scm_goods_order_good_unit_idToscm_good_units,
      },
      create: {
        ...sGood.scm_good_units_scm_goods_order_good_unit_idToscm_good_units!,
      },
    });

    const {
      last_ware_price,
      instore,
      standard_base_unit,
      scm_good_units_scm_goods_order_good_unit_idToscm_good_units,
      ...rest
    } = sGood;
    await orderDb.scm_goods.upsert({
      where: {
        id: sGood.id,

      },
      update: {
        ...rest,
        standard_base_unit_id: standard_base_unit,
      },
      create: {
        ...rest,
        standard_base_unit_id: standard_base_unit,
      },
    });
  }
};

run();
