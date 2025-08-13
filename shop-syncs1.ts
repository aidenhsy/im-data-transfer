import { PrismaClient as SCMOrderProd } from './prisma/clients/scm-order-prod';
import { PrismaClient as SCMProd } from './prisma/clients/scm-prod';
import { PrismaClient as ProcurementProd } from './prisma/clients/im-procurement-prod';
import { PrismaClient as ImProd } from './prisma/clients/im-prod';
import { PrismaClient as ImBasicDataProd } from './prisma/clients/im-basic-data-prod';

const run = async () => {
  const scmProd = new SCMProd();
  const procurementProd = new ProcurementProd();

  const shops = await procurementProd.scm_shop.findMany();

  for (const shopItem of shops) {
    await scmProd.scm_shop.update({
      where: {
        id: shopItem.id,
      },
      data: {
        client_tier_id: shopItem.client_tier_id,
      },
    });
  }
};

run();
