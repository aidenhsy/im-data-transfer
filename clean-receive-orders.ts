import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Configure dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

const logFilePath = path.resolve(
  process.cwd(),
  'logs',
  'clean-receive-orders.txt'
);

const logAndWrite = (message: string) => {
  console.log(message);
  try {
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
    const content = message.endsWith('\n') ? message : message + '\n';
    fs.appendFileSync(logFilePath, content, 'utf8');
  } catch (error) {
    console.error('Failed to write log file:', error);
  }
};

const run = async () => {
  const imProcurementDB = new IMProcurement();
  const scmOrderDB = new ScmOrder();
  const scmDB = new Scm();
  const scmPricingDB = new ScmPricing();

  const orders = await scmOrderDB.procurement_orders.findMany({
    where: {
      status: {
        in: [3, 4, 5],
      },
    },
    take: 100,
    select: {
      client_order_id: true,
      created_at: true,
      procurement_order_details: {
        select: {
          id: true,
          deliver_qty: true,
          reference_id: true,
          name: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
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
        logAndWrite(
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
        logAndWrite(
          `order: ${order.client_order_id}\ndetail: ${detail.reference_id}`
        );
        continue;
      }

      if (
        Number(detail.deliver_qty) !== Number(im.actual_delivery_qty) ||
        Number(detail.deliver_qty) !== Number(scm?.deliver_goods_qty) ||
        Number(im.actual_delivery_qty) !== Number(scm?.deliver_goods_qty)
      ) {
        if (Number(im.actual_delivery_qty) === Number(scm?.deliver_goods_qty)) {
          await scmOrderDB.procurement_order_details.update({
            where: {
              id: detail.id,
            },
            data: {
              deliver_qty: Number(im.actual_delivery_qty),
            },
          });
        }
        logAndWrite(
          `order: ${order.client_order_id}\ndetail: ${detail.reference_id}\n下单时间: ${order.created_at}\n品名: ${detail.name}\nim小程序: ${im.actual_delivery_qty}\nscm订单: ${scm?.deliver_goods_qty}\n中心发货: ${detail.deliver_qty}\n-----------------------------\n\n`
        );
      }
    }
  }
};

run();
