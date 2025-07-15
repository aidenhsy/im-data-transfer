import { PrismaClient as SCMProd } from '../prisma/clients/scm-prod';

const run = async () => {
  const scm = new SCMProd();

  const scmGoods = await scm.scm_goods.findMany({
    where: {
      id: {
        gt: 8378,
      },
      standard_base_unit: null,
      status: 1,
    },
    include: {
      scm_good_units_scm_goods_base_good_unit_idToscm_good_units: true,
    },
  });

  for (const g of scmGoods) {
    const standardUnit = await scm.standard_units.findFirst({
      where: {
        name: g.scm_good_units_scm_goods_base_good_unit_idToscm_good_units
          ?.name,
      },
    });

    if (!standardUnit) {
      console.log(g.id);
      continue;
    }

    await scm.scm_goods.update({
      where: {
        id: g.id,
      },
      data: {
        standard_base_unit: standardUnit.id,
      },
    });
  }
};

run();
