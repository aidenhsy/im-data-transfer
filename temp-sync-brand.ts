import { PrismaClient as ImDevBasicData } from './prisma/clients/im-dev-basic-data';
import { PrismaClient as ImProcurement } from './prisma/clients/im-procurement';

const run = async () => {
  const imDevBasicData = new ImDevBasicData();
  const imProcurement = new ImProcurement();

  const brands = await imProcurement.scm_shop_brand.findMany();

  for (const brand of brands) {
    await imDevBasicData.scm_shop_brand.upsert({
      where: {
        id: brand.id,
      },
      update: brand,
      create: brand,
    });
  }
};

run();
