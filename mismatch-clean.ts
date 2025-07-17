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

  const length = procurementOrders.length;
  let count = 0;

  for (const procurementOrder of procurementOrders) {
    count++;
    if (count % 100 === 0) {
      console.log(`${count}/${length}`);
    }
    const scmOrder = await scmDB.scm_order_details.findMany({
      where: {
        reference_order_id: procurementOrder.id,
      },
    });

    if (scmOrder.length === 0) {
      console.log(procurementOrder.id);
      continue;
    }

    if (
      Number(procurementOrder.supplier_order_details.length) !==
      Number(scmOrder.length)
    ) {
      console.log(
        procurementOrder.supplier_order_details.length,
        scmOrder.length
      );
    }
  }

  console.log('done');
  process.exit(0);
};

run();
