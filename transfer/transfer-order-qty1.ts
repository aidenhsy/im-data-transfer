import { PrismaClient as IMProcurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as IMProcurementDev } from '../prisma/clients/im-procurement-dev';
import { PrismaClient as ScmOrder } from '../prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from '../prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from '../prisma/clients/scm-pricing-prod';

const run = async () => {
  const imProcurement = new IMProcurement();

  const orders = await imProcurement.supplier_orders.findMany({
    where: {
      id: {
        in: [
          '2cfba8aa-bfb2-41f7-8207-81261a29d69a',
          'ac1a5937-ff48-4f24-b2d5-b72c56cac2a2',
          '688ff26d-5c07-4c9a-8866-542f0bf68b94',
          '66cff3ba-90c8-4ee6-bd57-d9fd3bc95c8b',
          '2153ecc5-069d-454f-a4b2-49ddab693b1d',
          '1d6ae737-54c0-4122-adc5-ae0f4b495b0a',
          '61897f12-a475-494d-82c3-af7ef9ac285b',
        ],
      },
    },
    include: {
      supplier_order_details: true,
    },
  });

  for (const order of orders) {
    for (const detail of order.supplier_order_details) {
      await imProcurement.supplier_order_details.update({
        where: {
          id: detail.id,
        },
        data: {
          confirm_delivery_qty: detail.actual_delivery_qty,
          final_qty: detail.actual_delivery_qty,
        },
      });
    }

    const updatedOrder = await imProcurement.supplier_order_details.findMany({
      where: {
        order_id: order.id,
      },
    });

    const actualAmount = updatedOrder.reduce(
      (acc, curr) =>
        acc + Number(curr.actual_delivery_qty) * Number(curr.price),
      0
    );

    console.log(actualAmount.toFixed(2));

    await imProcurement.supplier_orders.update({
      where: {
        id: order.id,
      },
      data: {
        status: 4,
        actual_amount: actualAmount.toFixed(2),
      },
    });
  }
};
run();
