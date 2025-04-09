import { PrismaClient  as ImClient } from '../prisma/clients/im';
import { PrismaClient as SaihuClient } from '../prisma/clients/saihu';

const run = async () => {
  const im = new ImClient();
  const saihu = new SaihuClient();


  const scmGoods: Array<{
    id : string;
    category_name: string;
    category_id: number;
    photo_url: string
    sold_time: string;
  }> =await saihu.$queryRawUnsafe(`
      select ssp.id, sgc.name category_name, sg.photo_url ,sg.category_id, COALESCE(TO_CHAR(ss.sold_time,'HH24:MI:SS'),'21:00:00') sold_time
      from scm_supply_plan_scm_goods ssp
      left join scm_goods sg on sg.id = ssp.good_id
      left join scm_goods_category sgc on sgc.id = sg.category_id
      left join scm_stock ss on ss.id = sg.stock_id
  `);

  // const scmGoods = await saihu.scm_supply_plan_scm_goods.findMany({
  //   include: {
  //     scm_goods: {
  //       include: {
  //         scm_goods_category: true,
  //         scm_stock: true,
  //       },
  //     },
  //   },
  // });

  for (const item of scmGoods) {

    const exists = await im.scm_supply_plan_scm_goods.findUnique({
      where: { id: item.id }
    });
    if (!exists) {
      console.error(`记录不存在: ID=${item.id}`);
      continue;
    }
    await im.scm_supply_plan_scm_goods.update({
      where: {
        id: item.id,
      },
      data: {
        category_name: item.category_name,
        photo_url: item.photo_url,
        category_id: item.category_id,
        sold_time: item.sold_time
      },
    });
  }
};

run();
