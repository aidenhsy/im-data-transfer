import { PrismaClient as IMProcurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as IMBasicData } from '../prisma/clients/im-basic-data-prod';

const run = async () => {
  const imProcurement = new IMProcurement();
  const imBasicData = new IMBasicData();

  const goods = await imProcurement.generic_items.findMany();

  const length = goods.length;
  let num = 1;

  for (const good of goods) {
    console.log(`${num}/${length} ${good.id}`);
    num++;

    await imBasicData.generic_items.upsert({
      where: { id: good.id },
      update: {
        ...good,
      },
      create: {
        ...good,
      },
    });
  }
};

run();
