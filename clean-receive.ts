import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
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

  for (const item of cleanReceive) {
    const detail = await scmOrderDB.procurement_order_details.findUnique({
      where: { id: item.detail_id },
      include: {
        procurement_orders: true,
      },
    });
    if (!detail) {
      console.log(`Detail ${item.detail_id} not found`);
      continue;
    }

    const procurementRecord =
      await imProcurementDB.supplier_order_details.findFirst({
        where: {
          order_id: detail.procurement_orders.client_order_id,
          supplier_reference_id: detail.reference_id!,
        },
      });
    if (!procurementRecord) {
      console.log(`Procurement record ${item.detail_id} not found`);
      continue;
    }

    const prodRecord = await scmDB.scm_order_details.findFirst({
      where: {
        reference_order_id: detail.procurement_orders.client_order_id,
        reference_id: detail.reference_id!,
      },
    });
    if (!prodRecord) {
      console.log(`Prod record ${item.detail_id} not found`);
      continue;
    }

    await scmOrderDB.procurement_order_details.update({
      where: { id: item.detail_id },
      data: {
        order_qty: item.order_qty,
        deliver_qty: item.sent_qty,
        customer_receive_qty: item.receive_qty,
        final_qty: item.final_qty,
      },
    });
    await scmDB.scm_order_details.update({
      where: { id: prodRecord.id },
      data: {
        delivery_qty: item.final_qty,
        deliver_goods_qty: item.sent_qty,
      },
    });

    await imProcurementDB.supplier_order_details.update({
      where: { id: procurementRecord.id },
      data: {
        order_qty: item.order_qty,
        actual_delivery_qty: item.sent_qty,
        confirm_delivery_qty: item.receive_qty,
        final_qty: item.final_qty,
      },
    });
  }
  console.log('done');
};

run();
