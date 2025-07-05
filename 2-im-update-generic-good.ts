import { PrismaClient as IMProd } from './prisma/clients/im-prod';
import { PrismaClient as SCMProd } from './prisma/clients/scm-prod';
import { PrismaClient as ImProcurementProd } from './prisma/clients/im-procurement-prod';

const run = async () => {
  const scm = new SCMProd();
  const imProcurement = new ImProcurementProd();

  const goods = await scm.scm_goods.findMany();

  for (const g of goods) {
    await imProcurement.generic_items.upsert({
      where: {
        id: g.id,
      },
      update: {
        name: g.name,
        status: g.status,
      },
      create: {
        id: g.id,
        name: g.name,
        category_id: g.category_id,
        status: g.status,
        create_time: g.create_time,
        update_time: g.update_time,
        letter_name: g.letter_name,
        photo_url: g.photo_url,
        stock_category_id: 1,
        base_unit_id: g.standard_base_unit,
      },
    });
  }
};

run();
