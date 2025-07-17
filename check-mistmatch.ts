import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as IMProcurementDev } from './prisma/clients/im-procurement-dev';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const imProcurementDB = new IMProcurement();
  const scmOrderDB = new ScmOrder();
  const scmDB = new Scm();

  const orders = await scmDB.scm_order_details.findMany({
    where: {
      reference_order_id: {
        not: null,
      },
    },
  });

  for (const order of orders) {
    const imProcurementOrder = await imProcurementDB.supplier_orders.findFirst({
      where: {
        id: order.reference_order_id!,
      },
    });

    if (!imProcurementOrder) {
      console.log('not found', order.reference_order_id);
    }
  }

  console.log('done');
  process.exit(0);
};

run();
