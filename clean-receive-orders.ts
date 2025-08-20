import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Configure dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

const run = async () => {
  const imProcurementDB = new IMProcurement();
  const scmOrderDB = new ScmOrder();
  const scmDB = new Scm();
  const scmPricingDB = new ScmPricing();

  const finishedOrders = await imProcurementDB.supplier_orders.findMany({
    where: {
      status: {
        in: [4, 5],
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  for (const finishedOrder of finishedOrders) {
    const scm = await scmDB.scm_order_details.findFirst({
      where: {
        reference_order_id: finishedOrder.id,
      },
      select: {
        scm_order: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
    if (!scm) {
      console.log(finishedOrder.id, 'has no scm order');
      continue;
    }

    if (scm.scm_order.status !== 3) {
      console.log(
        finishedOrder.id,
        'scm order status is not 3',
        scm.scm_order.id
      );
    }
  }

  console.log('done');
};

run();
