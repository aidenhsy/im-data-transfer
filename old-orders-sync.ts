import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as IMProcurementDev } from './prisma/clients/im-procurement-dev';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const imProcurementDev = new IMProcurementDev();
  const imProcurementProd = new IMProcurement();
  const scmProd = new Scm();
  const scmOrderProd = new ScmOrder();
  const scmPricingProd = new ScmPricing();

  const shops = await imProcurementProd.scm_shop.findMany();
  const dates = [
    '2025-07-01',
    '2025-07-02',
    '2025-07-03',
    '2025-07-04',
    '2025-07-05',
    '2025-07-06',
    '2025-07-07',
    '2025-07-08',
    '2025-07-09',
    '2025-07-10',
    '2025-07-11',
    '2025-07-12',
    '2025-07-13',
    '2025-07-14',
  ];

  for (const shop of shops) {
    for (const date of dates) {
      const orderItems = await imProcurementDev.old_records.findMany({
        where: {
          shop_id: shop.id.toString(),
          delivery_date: date,
        },
      });
      for (const item of orderItems) {
        const orderDetailItem = await scmProd.scm_order_details.findFirst({
          where: {
            id: Number(item.id),
          },
          include: {
            scm_order: true,
          },
        });
        const goodPricing = await scmPricingProd.scm_good_pricing.findFirst({
          where: {
            goods_id: Number(orderDetailItem?.goods_id),
          },
        });
        console.log(goodPricing);

        // console.log(
        //   orderDetailItem?.reference_id,
        //   orderDetailItem?.reference_order_id
        // );
      }
      break;
    }
  }
};

run();
