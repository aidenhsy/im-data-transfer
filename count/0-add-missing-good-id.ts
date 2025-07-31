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
      goods_id: null,
    },
  });

  for (const detail of details) {
    const good = await scmPricing.scm_goods.findFirst({
      where: {
        name: detail.goods_name!,
      },
    });

    if (!good) {
      console.log(detail.goods_name);
    }
  }
};

run();
