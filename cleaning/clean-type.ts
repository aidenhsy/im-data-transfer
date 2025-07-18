import { PrismaClient as IMProcurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as IMProcurementDev } from '../prisma/clients/im-procurement-dev';
import { PrismaClient as ScmOrder } from '../prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from '../prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from '../prisma/clients/scm-pricing-prod';
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

  const procurementOrders = await imProcurementDB.supplier_orders.findMany();
  const length = procurementOrders.length;
  let count = 0;

  for (const order of procurementOrders) {
    count++;
    if (count % 100 === 0) {
      console.log(`${count}/${length}`);
    }
    const scmOrderDetail = await scmDB.scm_order_details.findFirst({
      where: {
        reference_order_id: order.id,
      },
      select: {
        scm_order: {
          select: {
            automatic: true,
            create_time: true,
          },
        },
      },
    });

    if (!scmOrderDetail) {
      continue;
    }

    if (scmOrderDetail.scm_order?.automatic === 2 && order.type !== 1) {
      const scmOrder = await scmOrderDB.procurement_orders.findFirst({
        where: {
          client_order_id: order.id,
        },
      });
      if (!scmOrder) {
        console.log('scmOrder not found', order.id);
        continue;
      }

      await scmOrderDB.procurement_orders.update({
        where: { id: scmOrder.id },
        data: {
          type: 1,
        },
      });
      await imProcurementDB.supplier_orders.update({
        where: { id: order.id },
        data: { type: 1 },
      });
    }
  }
};

run();
