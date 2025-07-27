import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';

const run = async () => {
  const procurement = new Procurement();
  const order = new Order();

  const procurementOrders = await procurement.supplier_orders.findMany({
    where: {
      status: {
        in: [4, 5, 20],
      },
    },
    include: {
      supplier_order_details: true,
    },
  });

  for (const procurementOrder of procurementOrders) {
    for (const procurementDetail of procurementOrder.supplier_order_details) {
      if (procurementDetail.confirm_delivery_qty === null) {
        console.log(
          `${procurementOrder.id} ${procurementDetail.supplier_reference_id} actual delivery qty is null`
        );
        continue;
      }

      const scmDetail = await order.procurement_order_details.findFirst({
        where: {
          reference_id: procurementDetail.supplier_reference_id,
          procurement_orders: {
            client_order_id: procurementOrder.id,
          },
        },
      });

      if (!scmDetail) {
        console.log(
          `${procurementOrder.id} ${procurementDetail.supplier_reference_id} scm order missing`
        );
        continue;
      }

      await order.procurement_order_details.update({
        where: {
          id: scmDetail.id,
        },
        data: {
          customer_receive_qty: Number(procurementDetail.confirm_delivery_qty),
        },
      });
    }
  }
};

run();
