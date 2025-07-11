import axios from 'axios';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as IM } from './prisma/clients/im-prod';

const run = async () => {
  const scm = new Scm();
  const im = new IM();
  const scmPricing = new ScmPricing();

  const VERSION = '20250710';
  const LOCKED_AFTER_DATE = new Date('2025-07-10T03:30:00.000Z');

  const shops = await im.scm_shop.findMany({
    where: {
      status: 1,
    },
  });

  for (const shop of shops) {
    console.log(`Processing shop ${shop.shop_name}`);
    const { data } = await axios.get(
      'https://apiim.shaihukeji.com/goods/goodlist',
      {
        params: {
          shopId: shop.id,
        },
      }
    );

    for (const category of data.data) {
      for (const good of category.goods) {
        if (!good.referenceId) {
          console.log(
            `Good ${good.goodsName} ${shop.shop_name} has no reference id`
          );
          continue;
        }
        const scmGoodPricing = await scm.scm_good_pricing.findFirst({
          where: {
            id: good.referenceId,
          },
        });

        if (!scmGoodPricing) {
          console.log(
            `Good ${good.goodsName} ${shop.shop_name} has no scm good pricing`
          );
          continue;
        }
      }
    }
  }
};

run();
