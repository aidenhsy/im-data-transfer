import { PrismaClient  as ImClient } from '../prisma/clients/im';

const run = async () => {
  const prisma = new ImClient();

  const scmItems = await prisma.scm_supply_plan_scm_goods.findMany({
    include: {
      scm_goods: true,
    },
  });

  const totalLength = scmItems.length;
  let index = 1;

  for (const item of scmItems) {
    console.log(`Processing ${index++} of ${totalLength}`);
    await prisma.scm_supply_plan_scm_goods.update({
      where: {
        id: item.id,
      },
      data: {
        letter_name: item.scm_goods?.letter_name,
      },
    });
  }
};

run();
