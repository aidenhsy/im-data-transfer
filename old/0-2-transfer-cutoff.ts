import { PrismaClient as IMProd } from '../prisma/clients/im-prod';
import { PrismaClient as SCMProd } from '../prisma/clients/scm-prod';

const run = async () => {
  const scm = new SCMProd();
  const im = new IMProd();

  const goods = await im.scm_supply_plan_scm_goods.findMany({
    where: {
      reference_id: {
        not: null,
      },
    },
  });

  console.log(`Found ${goods.length} goods`);
  let current = 1;

  for (const good of goods) {
    console.log(`Processing good ${current} of ${goods.length}`);
    current++;
    const goodPricing = await scm.scm_good_pricing.findFirst({
      where: {
        id: good.reference_id!,
      },
    });

    if (!goodPricing) {
      console.log(`Good pricing not found for ${good.reference_id}`);
      continue;
    }

    await scm.scm_good_pricing.update({
      where: {
        id: goodPricing.id,
      },
      data: {
        cut_off_time: good.sold_time,
      },
    });
  }
};

run();
