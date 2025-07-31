import { PrismaClient as ImInventory } from '../prisma/clients/im-inventory-prod';
import { PrismaClient as ImProd } from '../prisma/clients/im-prod';
import { PrismaClient as ImProcurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as ScmPricing } from '../prisma/clients/scm-pricing-prod';
import { PrismaClient as ScmProd } from '../prisma/clients/scm-prod';

const run = async () => {
  const imInventory = new ImInventory();
  const imProd = new ImProd();
  const imProcurement = new ImProcurement();
  const scmPricing = new ScmPricing();
  const scmProd = new ScmProd();

  const details = await imProd.scm_inventory_detail_copy.findMany({
    where: {
      goods_name: null,
    },
  });

  for (const detail of details) {
    const good = await scmPricing.scm_goods.findFirst({
      where: {
        id: detail.goods_id!,
      },
    });

    if (!good) {
      console.log(detail.goods_name);
      continue;
    }

    await imProd.scm_inventory_detail_copy.update({
      where: {
        id: detail.id,
      },
      data: {
        goods_name: good.name,
      },
    });
  }
};

run();
