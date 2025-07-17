import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as IMProcurementDev } from './prisma/clients/im-procurement-dev';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const imProcurementDB = new IMProcurement();
  const scmOrderDB = new ScmOrder();
  const scmDB = new Scm();

  const procurementOrders = await imProcurementDB.supplier_orders.findMany({
    where: {
      status: {
        in: [4, 5],
      },
    },
    include: {
      supplier_order_details: true,
    },
  });

  for (const procurementOrder of procurementOrders) {
    const scmOrder = await scmDB.scm_order_details.findMany({
      where: {
        reference_order_id: procurementOrder.id,
      },
    });

    if (scmOrder.length === 0) {
      console.log(procurementOrder.id);
      continue;
    }

    console.log(
      procurementOrder.supplier_order_details.length,
      scmOrder.length
    );
  }

  console.log('done');
  process.exit(0);
};

run();
