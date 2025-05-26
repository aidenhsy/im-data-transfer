import { PrismaClient as SCMClient } from './prisma/clients/scm';
import { PrismaClient as IMClient } from './prisma/clients/im';

const run = async () => {
  const scmClient = new SCMClient();
  const imClient = new IMClient();

  const goods = await imClient.supplier_items.findMany({
    take: 100,
  });
  for (const good of goods) {
    const scmGoodPrice = await scmClient.scm_good_pricing.findFirst({
      where: {
        version: '20250526',
        goods_id: good.id,
        client_tier_id: 2,
      },
    });
    if (scmGoodPrice) {
      console.log('update', good.id);
      await imClient.supplier_items.update({
        where: {
          id: good.id,
        },
        data: {
          supplier_reference_id: scmGoodPrice.external_reference_id,
        },
      });
    }
  }
};

run();
