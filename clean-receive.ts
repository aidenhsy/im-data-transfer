import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';
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
  const scmPricingDB = new ScmPricing();

  const imProcurementDetails =
    await imProcurementDB.supplier_order_details.findMany({
      orderBy: {
        created_at: 'desc',
      },
      take: 1000,
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
    const scmOrder = await scmOrderDB.procurement_orders.findFirst({
      where: {
        client_order_id: imDetail.order_id,
      },
    });
    const scmPricing = await scmPricingDB.scm_good_pricing.findFirst({
      where: {
        external_reference_id: imDetail.supplier_reference_id,
      },
    });
    if (!scmOrder) {
      console.log(imDetail.order_id, 'order not found');
      continue;
    }
    if (!scmPricing) {
      console.log(imDetail.supplier_reference_id, 'pricing not found');
      continue;
    }
    if (!scmOrderDetail) {
      await scmOrderDB.procurement_order_details.create({
        data: {
          name: imDetail.supplier_item_name,
          reference_id: imDetail.supplier_reference_id,
          order_qty: imDetail.order_qty,
          price: imDetail.price,
          cut_off_time: imDetail.cut_off_time,
          order_id: scmOrder.id,
          deliver_qty: null,
          good_id: scmPricing.goods_id,
          unit_id: scmPricing.good_unit_id,
          pricing_id: scmPricing.id,
          weighted_average_cost: scmPricing.weighted_average_cost,
        },
      });
      console.log(imDetail.supplier_reference_id, 'created');
    }
  }

  console.log('done');
};

run();
