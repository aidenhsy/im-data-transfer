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

  const orderIds = await scmDB.scm_order_details.findMany({
    distinct: ['reference_order_id'],
    select: {
      reference_order_id: true,
      scm_order: {
        select: {
          arrival_time: true,
        },
      },
    },
    orderBy: {
      create_time: 'desc',
    },
  });

  console.log(orderIds.length);

  for (const order of orderIds) {
    if (order.scm_order.arrival_time) {
      const procurementOrder = await imProcurementDB.supplier_orders.findFirst({
        where: {
          id: order.reference_order_id!,
        },
      });

      if (procurementOrder?.status === 1 || procurementOrder?.status === 0) {
        console.log(order.reference_order_id);
      }
    }
  }
  console.log('done');
};

run();
