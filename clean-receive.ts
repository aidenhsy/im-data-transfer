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

  const imProcurementDetails =
    await imProcurementDB.supplier_order_details.findMany({
      select: {
        id: true,
        supplier_reference_id: true,
        order_id: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

  for (const imDetail of imProcurementDetails) {
    const scmOrderDetail = await scmOrderDB.procurement_order_details.findFirst(
      {
        where: {
          reference_id: imDetail.supplier_reference_id,
          procurement_orders: {
            client_order_id: imDetail.order_id,
          },
        },
        select: {
          id: true,
        },
      }
    );
    if (!scmOrderDetail) {
      console.log(imDetail.supplier_reference_id);
    }
  }

  console.log('done');
};

run();
