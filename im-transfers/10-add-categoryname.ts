import { PrismaClient  as ImClient } from '../prisma/clients/im';
import { PrismaClient as SaihuClient } from '../prisma/clients/saihu';
import dayjs from 'dayjs';

const run = async () => {
  const im = new ImClient();
  const saihu = new SaihuClient();

  const scmGoods = await saihu.scm_supply_plan_scm_goods.findMany({
    include: {
      scm_goods: {
        include: {
          scm_goods_category: true,
          scm_stock: true,
        },
      },
    },
  });

  for (const item of scmGoods) {
    await im.scm_supply_plan_scm_goods.update({
      where: {
        id: item.id,
      },
      data: {
        category_name: item.scm_goods?.scm_goods_category?.name,
        photo_url: item.scm_goods?.photo_url,
        category_id: item.scm_goods?.category_id,
        sold_time: item.scm_goods?.scm_stock?.sold_time ? item.scm_goods?.scm_stock?.sold_time : '21:00:00'
      },
    });
  }
};

run();
