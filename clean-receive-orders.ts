import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import axios from 'axios';

// Configure dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

const run = async () => {
  const imProcurementDB = new IMProcurement();
  const scmOrderDB = new ScmOrder();
  const scmDB = new Scm();
  const scmPricingDB = new ScmPricing();

  const orders = await scmOrderDB.procurement_orders.findMany({
    select: {
      client_order_id: true,
      created_at: true,
      procurement_order_details: {
        select: {
          id: true,
          order_qty: true,
          reference_id: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  console.log(orders.length);

  for (const order of orders) {
    for (const detail of order.procurement_order_details) {
      const procurementOrderDetail =
        await imProcurementDB.supplier_order_details.findFirst({
          where: {
            supplier_reference_id: detail.reference_id!,
            order_id: order.client_order_id,
          },
        });

      if (
        Number(detail.order_qty) !== Number(procurementOrderDetail?.order_qty)
      ) {
        const scm = await scmDB.scm_order_details.findFirst({
          where: {
            reference_order_id: procurementOrderDetail?.order_id,
            reference_id: detail.reference_id,
          },
        });
        console.log(
          `order: ${detail.order_qty}\nprocurement: ${procurementOrderDetail?.order_qty}\nscm: ${scm?.num}`
        );
      }
    }
  }
};

run();
