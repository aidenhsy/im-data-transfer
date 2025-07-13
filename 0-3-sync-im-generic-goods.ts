import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as IM } from './prisma/clients/im-prod';
import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';

const run = async () => {
  const scm = new Scm();
  const imProcurement = new IMProcurement();

  const goods = await scm.scm_goods.findMany();

  for (const good of goods) {
    await imProcurement.generic_items.upsert({
      where: {
        id: good.id,
      },
      update: {
        name: good.name,
        category_id: good.category_id,
        status: good.status,
        letter_name: good.letter_name,
        photo_url: good.photo_url,
        base_unit_id: good.standard_base_unit,
      },
      create: {
        id: good.id,
        name: good.name,
        category_id: good.category_id,
        status: good.status,
        create_time: good.create_time,
        update_time: good.update_time,
        letter_name: good.letter_name,
        photo_url: good.photo_url,
        stock_category_id: 1,
        base_unit_id: good.standard_base_unit,
      },
    });
  }
};

run();
