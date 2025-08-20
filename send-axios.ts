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

  const order = await imProcurementDB.supplier_orders.findFirst({
    where: {
      id: '0c20f7a4-9d92-4f9d-ae21-09fe0ed0836a',
    },
    include: {
      supplier_order_details: true,
    },
  });

  const { data } = await axios.post(
    // 'https://scmms.shaihukeji.com/order/callback/customer-receive-order',
    'http://localhost:4001/callback/customer-receive-order',
    {
      order_id: order?.id,
      status: order?.status,
      receive_time: order?.receive_time,
      order_details: order?.supplier_order_details.map((detail) => ({
        reference_id: detail.supplier_reference_id,
        received_qty: detail.confirm_delivery_qty,
      })),
    }
  );

  console.log(data);

  console.log('done');
};

run();
