import { DatabaseLocalService } from './database-local';

const run = async () => {
  const database = new DatabaseLocalService();
  await database.connect();

  const goods = await database.scmLocal.scm_goods.findMany({
    include: {
      scm_good_units_scm_goods_order_good_unit_idToscm_good_units: {
        select: {
          id: true,
          name: true,
          ratio_to_base: true,
        },
      },
    },
    orderBy: {
      id: 'asc',
    },
  });
  console.log(goods.length);

  for (const good of goods) {
    console.log(good.id);
    await database.scmSortLocal.goods.upsert({
      where: {
        id: good.id,
      },
      update: {},
      create: {
        id: good.id,
        name: good.name,
        category_id: good.category_id,
        base_meta_unit_id: Number(good.standard_base_unit),
        base_sale_unit:
          good.scm_good_units_scm_goods_order_good_unit_idToscm_good_units
            ?.name || '',
        meta_to_sale_ratio:
          good.scm_good_units_scm_goods_order_good_unit_idToscm_good_units
            ?.ratio_to_base || 0,
        is_public: good.is_public,
        photo_url: good.photo_url,
        tt_code: good.tt_code,
        status: good.status,
        creator: '767',
        updater: '767',
      },
    });
  }

  await database.disconnect();
};

run();
