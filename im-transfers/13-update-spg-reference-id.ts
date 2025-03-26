import { PrismaClient } from '@prisma/client';

const run = async () => {
  const prisma = new PrismaClient();

  const spgs = await prisma.scm_supply_plan_scm_goods.findMany({
    where: {
      reference_id: null,
    },
  });

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
      console.log(spg.good_id);
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
      },
    });
  }
};

run();
