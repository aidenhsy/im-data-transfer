import { PrismaClient  as ImClient } from '../prisma/clients/im';
import dayjs from 'dayjs';

const run = async () => {
  const prisma = new ImClient();

  const scmGoods = await prisma.scm_supply_plan_scm_goods.findMany({
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
    await prisma.scm_supply_plan_scm_goods.update({
      where: {
        id: item.id,
      },
      data: {
        category_name: item.scm_goods?.scm_goods_category?.name,
        photo_url: item.scm_goods?.photo_url,
        category_id: item.scm_goods?.category_id,
        sold_time: dayjs(item.scm_goods?.scm_stock?.sold_time).format(
          'HH:mm:ss'
        ),
      },
    });
  }
};

run();
