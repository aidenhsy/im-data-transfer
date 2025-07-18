import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as IMProcurementDev } from './prisma/clients/im-procurement-dev';
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

  const procurementOrders = await imProcurementDB.supplier_orders.findMany({
    where: {
      status: {
        in: [4, 5],
      },
    },
  });

  const length = procurementOrders.length;
  let count = 0;
  console.log(length);
  for (const order of procurementOrders) {
    count++;
    if (count % 100 === 0) {
      console.log(`${count}/${length}`);
    }
    const scmOrder = await scmDB.scm_order_details.findFirst({
      where: {
        reference_order_id: order.id,
      },
      select: {
        scm_order: {
          select: {
            delivery_day_info_id: true,
            delivery_time: true,
            receival_time: true,
            create_time: true,
          },
        },
      },
    });

    if (order.delivery_date !== scmOrder?.scm_order?.delivery_day_info_id) {
      // Convert UTC times to Shanghai time using dayjs
      const procurementTimeShanghai = order.created_at;

      const scmTimeShanghai = scmOrder?.scm_order?.create_time;

      console.log(
        'procurement create_time:',
        procurementTimeShanghai,
        'scm create_time:',
        scmTimeShanghai,
        'procurement delivery_date:',
        order.delivery_date,
        'scm delivery date',
        scmOrder?.scm_order?.delivery_day_info_id
      );
    }
  }

  console.log('done');
  process.exit(0);
};

run();
