import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as IMProcurementDev } from './prisma/clients/im-procurement-dev';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const imProcurementDB = new IMProcurement();
  const scmOrderDB = new ScmOrder();
  const scmDB = new Scm();

  const shops = await imProcurementDB.scm_shop.findMany({
    where: {
      status: 1,
    },
  });

  for (const shop of shops) {
    const orders = await imProcurementDB.supplier_orders.findMany({
      where: {
        shop_id: shop.id,
        actual_amount: {
          not: null,
        },
      },
    });

    for (const order of orders) {
      const sameAmount = await imProcurementDB.supplier_orders.findMany({
        where: {
          shop_id: shop.id,
          actual_amount: order.actual_amount,
          delivery_date: order.delivery_date,
        },
      });

      if (sameAmount.length > 1) {
        console.log(sameAmount);
      }
    }
  }

  console.log('done');
  process.exit(0);
};

run();
