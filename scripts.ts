import { PrismaClient as SCMClient } from './prisma/clients/scm';
import { PrismaClient as IMClient } from './prisma/clients/im';

const run = async () => {
  const scmClient = new SCMClient();
  const imClient = new IMClient();

  const goods = await imClient.scm_supply_plan_scm_goods.findMany();

  for (const good of goods) {
    const scmGoodPrice = await scmClient.scm_good_pricing.findFirst({
      where: {
        id: good.reference_id || '',
      },
    });
    if (scmGoodPrice) {
      await imClient.scm_supply_plan_scm_goods.update({
        where: {
          id: good.id,
        },
        data: {
          new_reference_id: scmGoodPrice.external_reference_id,
        },
      });
    }
  }
};

run();
