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

  const imDetails = await imProcurementDB.supplier_order_details.findMany({
    where: {
      confirm_delivery_qty: {
        not: null,
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  for (const detail of imDetails) {
    const scmOrderDetail = await scmOrderDB.procurement_order_details.findFirst(
      {
        where: {
          reference_id: detail.supplier_reference_id,
          procurement_orders: {
            client_order_id: detail.order_id,
          },
        },
      }
    );
    if (!scmOrderDetail) {
      console.log('scmOrderDetail not found', detail.id);
      continue;
    }
    if (
      Number(scmOrderDetail.customer_receive_qty) !==
      Number(detail.confirm_delivery_qty)
    ) {
      console.log(
        `update ${scmOrderDetail.id} ${scmOrderDetail.customer_receive_qty} ${detail.confirm_delivery_qty}`
      );
      await scmOrderDB.procurement_order_details.update({
        where: { id: scmOrderDetail.id },
        data: {
          customer_receive_qty: detail.confirm_delivery_qty,
        },
      });
    }
  }
};

run();
