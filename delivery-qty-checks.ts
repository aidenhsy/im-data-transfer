import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from './prisma/clients/scm-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';

const run = async () => {
  const procurement = new Procurement();
  const basic = new Basic();
  const order = new Order();

  const procurementOrders = await procurement.supplier_orders.findMany({
    orderBy: {
      created_at: 'desc',
    },
    include: {
      supplier_order_details: true,
    },
  });

  for (const procurementOrder of procurementOrders) {
    for (const procurementDetail of procurementOrder.supplier_order_details) {
      const scmDetail = await order.procurement_order_details.findFirst({
        where: {
          reference_id: procurementDetail.supplier_reference_id,
          procurement_orders: {
            client_order_id: procurementOrder.id,
          },
        },
      });

      const scmBasic = await basic.scm_order_details.findFirst({
        where: {
          reference_id: procurementDetail.supplier_reference_id,
          reference_order_id: procurementOrder.id,
        },
      });

      if (!scmDetail || !scmBasic) {
        console.log(
          `${procurementOrder.id} ${procurementDetail.supplier_reference_id} missing`
        );
        continue;
      }

      if (
        Number(scmBasic.deliver_goods_qty) !== Number(scmDetail.deliver_qty) ||
        Number(scmBasic.deliver_goods_qty) !==
          Number(procurementDetail.actual_delivery_qty)
      ) {
        console.log(
          `${procurementOrder.id} ${procurementDetail.supplier_reference_id} delivery qty miss`
        );
      }
    }
  }
};

run();
