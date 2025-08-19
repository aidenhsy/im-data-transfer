import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import cleanReceive from './clean-receive.json';

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
  });

  console.log(orderIds.length);

  for (const order of orderIds) {
    const orderDetails = await scmDB.scm_order_details.count({
      where: {
        reference_order_id: order.reference_order_id,
      },
    });
    if (!order.reference_order_id) {
      console.log('no reference order id');
      continue;
    }
    const scmOrderDetails = await scmOrderDB.procurement_order_details.count({
      where: {
        procurement_orders: {
          client_order_id: order.reference_order_id!,
        },
      },
    });
    const procurementOrderDetails =
      await imProcurementDB.supplier_order_details.count({
        where: {
          order_id: order.reference_order_id!,
        },
      });
    const a = Number(orderDetails);
    const b = Number(scmOrderDetails);
    const c = Number(procurementOrderDetails);

    if (a !== b || b !== c || a !== c) {
      console.log(
        `orderId: ${order.reference_order_id} \nscm: ${a} scmOrder: ${b} procurement: ${c}\n------`
      );
    }
  }

  console.log('done');
};

run();
