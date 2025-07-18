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

  for (const order of procurementOrders) {
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
      console.log('automatic is 2 and type is not 1', order.id);
      console.log(scmOrderDetail.scm_order.create_time);
    }
  }
};

run();
