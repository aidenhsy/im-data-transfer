import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from './prisma/clients/scm-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';

const run = async () => {
  const procurement = new Procurement();
  const basic = new Basic();
  const order = new Order();

  const procurementOrders = await procurement.supplier_orders.findMany({
    where: {
      status: {
        notIn: [2, 4, 5, 20],
      },
    },
    include: {
      supplier_order_details: true,
    },
  });

  // Add your logic here
  console.log(`Found ${procurementOrders.length} procurement orders`);

  for (const procurementOrder of procurementOrders) {
    for (const procurementDetail of procurementOrder.supplier_order_details) {
      const basicDetail = await basic.scm_order_details.findFirst({
        where: {
          reference_id: procurementDetail.supplier_reference_id,
          reference_order_id: procurementOrder.id,
        },
      });
      if (!basicDetail) {
        continue;
      }
      const scmOrderDetail = await order.procurement_order_details.findFirst({
        where: {
          reference_id: procurementDetail.supplier_reference_id,
          procurement_orders: {
            client_order_id: procurementOrder.id,
          },
        },
      });
      if (!scmOrderDetail) {
        continue;
      }
      await procurement.supplier_order_details.update({
        where: {
          id: procurementDetail.id,
        },
        data: {
          actual_delivery_qty: Number(basicDetail.deliver_goods_qty),
        },
      });
      await procurement.supplier_orders.update({
        where: {
          id: procurementOrder.id,
        },
        data: {
          status: 2,
        },
      });
      await order.procurement_order_details.update({
        where: {
          id: scmOrderDetail.id,
        },
        data: {
          deliver_qty: Number(basicDetail.deliver_goods_qty),
        },
      });
      await order.procurement_orders.update({
        where: {
          id: scmOrderDetail.order_id,
        },
        data: {
          status: 3,
        },
      });
    }
  }

  await procurement.$disconnect();
  await basic.$disconnect();
  await order.$disconnect();
};

run().catch(console.error);
