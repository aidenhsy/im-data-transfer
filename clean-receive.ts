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

  const badOrders = await scmOrderDB.procurement_order_details.findMany({
    where: {},
    select: {
      id: true,
      order_qty: true,
      reference_id: true,
      procurement_orders: {
        select: {
          client_order_id: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    take: 10000,
  });

  for (const badOrder of badOrders) {
    const order = await imProcurementDB.supplier_order_details.findFirst({
      where: {
        order_id: badOrder.procurement_orders.client_order_id,
        supplier_reference_id: badOrder.reference_id!,
      },
    });

    if (Number(badOrder.order_qty) !== Number(order?.order_qty)) {
      const scm = await scmDB.scm_order_details.findFirst({
        where: {
          reference_id: badOrder.reference_id,
          reference_order_id: badOrder.procurement_orders.client_order_id,
        },
      });
      if (!scm) {
        console.log(badOrder.id);
        continue;
      }
      console.log(badOrder.id);
      await scmOrderDB.procurement_order_details.update({
        where: {
          id: badOrder.id,
        },
        data: {
          order_qty: order?.order_qty,
        },
      });
      await scmDB.scm_order_details.update({
        where: {
          id: scm.id,
        },
        data: {
          num: order?.order_qty,
        },
      });
    }
  }
};

run();
