import { PrismaClient  as ImClient } from '../prisma/clients/im';

const run = async () => {
  const prisma = new ImClient();

  const spgs = await prisma.scm_supply_plan_scm_goods.findMany({});

  const length = spgs.length;
  let count = 0;
  for (const spg of spgs) {
    console.log(`${count++}/${length}`);
    const pg = await prisma.scm_good_pricing.findFirst({
      where: {
        goods_id: spg.good_id!,
        client_tier_id: 2,
      },
    });

    if (!pg) {
      await prisma.scm_supply_plan_scm_goods.update({
        where: {
          id: spg.id,
        },
        data: {
          is_enabled: false,
        },
      });
      continue;
    }

    await prisma.scm_supply_plan_scm_goods.update({
      where: {
        id: spg.id,
      },
      data: {
        reference_id: pg.id.toString(),
        price: pg.sale_price,
      },
    });
  }
};

run();
