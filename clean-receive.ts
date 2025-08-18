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
    where: {
      procurement_orders: {
        status: 3,
      },
      deliver_qty: null,
    },
    select: {
      id: true,
      reference_id: true,
      name: true,
      order_qty: true,
      good_id: true,
      price: true,
      procurement_orders: {
        select: {
          client_order_id: true,
          shop_id: true,
        },
      },
    },
  });
  console.log(badOrders.length);

  for (const badOrder of badOrders) {
    const scmProd = await scmDB.scm_order_details.findFirst({
      where: {
        reference_id: badOrder.reference_id,
        reference_order_id: badOrder.procurement_orders.client_order_id,
      },
    });
    if (!scmProd) {
      const otherRecord = await scmDB.scm_order_details.findFirst({
        where: {
          reference_order_id: badOrder.procurement_orders.client_order_id,
        },
      });
      if (!otherRecord) {
        console.log('dfsdf');
        continue;
      }
      const newRecord = await scmDB.scm_order_details.create({
        data: {
          goods_name: badOrder.name,
          num: Number(badOrder.order_qty),
          price: badOrder.price,
          goods_id: badOrder.good_id,
          status: 2,
          deliver_goods_qty: Number(badOrder.order_qty),
          order_id: otherRecord.order_id!,
          reference_id: badOrder.reference_id,
          reference_order_id: otherRecord.reference_order_id,
        },
      });
      console.log(newRecord.id);
      continue;
    }
    if (scmProd.deliver_goods_qty !== null) {
      console.log('updated');
      await scmOrderDB.procurement_order_details.update({
        where: {
          id: badOrder.id,
        },
        data: {
          deliver_qty: scmProd.deliver_goods_qty,
        },
      });
    }
  }

  console.log('done');
};

run();
