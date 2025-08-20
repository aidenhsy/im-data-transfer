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
    if (!finishedOrder.receive_time) {
      console.log(finishedOrder.id, 'has no receive time');
      continue;
    }
    const scmOrder = await scmOrderDB.procurement_orders.findFirst({
      where: {
        client_order_id: finishedOrder.id,
      },
    });
    if (!scmOrder) {
      console.log(finishedOrder.id, 'has no scm order');
      continue;
    }
    await scmOrderDB.procurement_orders.update({
      where: {
        id: scmOrder.id,
      },
      data: {
        customer_receive_time: finishedOrder.receive_time,
      },
    });
  }

  console.log('done');
};

run();
