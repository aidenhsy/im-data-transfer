import { PrismaClient } from './prisma/clients/im';
import { getitemcategoryinfo } from './tcsl/基础档案/品项类别信息';

const run = async () => {
  const prisma = new PrismaClient();

  let hasMore = true;
  let pageNo = 1;

  while (hasMore) {
    console.log(`正在获取第${pageNo}页数据`);
    const categories = await getitemcategoryinfo(pageNo);
    for (const category of categories.category) {
      await prisma.st_food_category.upsert({
        where: {
          id: category.class_id,
        },
        update: {
          name: category.class_name,
          parent_id: category.parent_id.toString(),
          level: category.level,
          brand_name: category.brand_name,
          delflg: category.delflg,
        },
        create: {
          id: category.class_id,
          name: category.class_name,
          parent_id: category.parent_id.toString(),
          level: category.level,
          delflg: category.delflg,
          brand_name: category.brand_name,
        },
      });
    }

    if (categories.pageInfo.pageTotal === pageNo) {
      hasMore = false;
    }
    pageNo++;
  }
};

run();
