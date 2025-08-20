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
    where: {
      status: {
        in: [4, 5],
      },
    },
    select: {
      client_order_id: true,
      procurement_order_details: {
        select: {
          deliver_qty: true,
          reference_id: true,
        },
      },
    },
  });

  for (const order of orders) {
    for (const detail of order.procurement_order_details) {
      const scm = await scmDB.scm_order_details.findFirst({
        where: {
          reference_order_id: order.client_order_id,
          reference_id: detail.reference_id,
        },
      });
      if (!scm) {
        console.log(
          `order: ${order.client_order_id}\ndetail: ${detail.reference_id}`
        );
      }
      const im = await imProcurementDB.supplier_order_details.findFirst({
        where: {
          order_id: order.client_order_id,
          supplier_reference_id: detail.reference_id!,
        },
      });
      if (!im) {
        console.log(
          `order: ${order.client_order_id}\ndetail: ${detail.reference_id}`
        );
        continue;
      }

      if (
        Number(detail.deliver_qty) !== Number(im.actual_delivery_qty) ||
        Number(detail.deliver_qty) !== Number(scm?.deliver_goods_qty) ||
        Number(im.actual_delivery_qty) !== Number(scm?.deliver_goods_qty)
      ) {
        console.log(
          `order: ${order.client_order_id}\ndetail: ${detail.reference_id}\nim: ${im.actual_delivery_qty}\nscm: ${scm?.deliver_goods_qty}\nscmOrder: ${detail.deliver_qty}\n-----------------------------\n\n`
        );
      }
    }
  }
};

run();
