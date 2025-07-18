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
    const scmOrderDetail = await scmDB.scm_order_details.findFirst({
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
            automatic: true,
          },
        },
      },
    });

    if (
      order.delivery_date !== scmOrderDetail?.scm_order?.delivery_day_info_id
    ) {
      // Convert UTC times to Shanghai time using dayjs
      const scmOrder = await scmOrderDB.procurement_orders.findFirst({
        where: {
          client_order_id: order.id,
        },
      });
      if (!scmOrder) {
        console.log('scmOrder not found', order.id);
        continue;
      }

      if (scmOrderDetail?.scm_order?.create_time! < order.created_at) {
        if (scmOrderDetail?.scm_order?.automatic) {
          await scmOrderDB.procurement_orders.update({
            where: {
              id: scmOrder.id,
            },
            data: {
              delivery_date: scmOrderDetail?.scm_order?.delivery_day_info_id!,
              created_at: scmOrderDetail?.scm_order?.create_time!,
              delivery_time: scmOrderDetail?.scm_order?.delivery_time!,
              customer_receive_time: scmOrderDetail?.scm_order?.receival_time!,
              type: 1,
            },
          });
          await imProcurementDB.supplier_orders.update({
            where: {
              id: order.id,
            },
            data: {
              delivery_date: scmOrderDetail?.scm_order?.delivery_day_info_id!,
              delivery_time: scmOrderDetail?.scm_order?.delivery_time!,
              receive_time: scmOrderDetail?.scm_order?.receival_time!,
              created_at: scmOrderDetail?.scm_order?.create_time!,
              type: 1,
            },
          });
        } else {
          await scmOrderDB.procurement_orders.update({
            where: {
              id: scmOrder.id,
            },
            data: {
              delivery_date: scmOrderDetail?.scm_order?.delivery_day_info_id!,
              created_at: scmOrderDetail?.scm_order?.create_time!,
              delivery_time: scmOrderDetail?.scm_order?.delivery_time!,
              customer_receive_time: scmOrderDetail?.scm_order?.receival_time!,
            },
          });
          await imProcurementDB.supplier_orders.update({
            where: {
              id: order.id,
            },
            data: {
              delivery_date: scmOrderDetail?.scm_order?.delivery_day_info_id!,
              delivery_time: scmOrderDetail?.scm_order?.delivery_time!,
              receive_time: scmOrderDetail?.scm_order?.receival_time!,
              created_at: scmOrderDetail?.scm_order?.create_time!,
            },
          });
        }
        break;
      }
    }
  }

  console.log('done');
  process.exit(0);
};

run();
