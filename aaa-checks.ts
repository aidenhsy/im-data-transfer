import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from './prisma/clients/scm-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';

const run = async () => {
  const procurementDB = new Procurement();
  const basicDB = new Basic();
  const orderDB = new Order();

  const details = await procurementDB.supplier_order_details.findMany({
    where: {
      final_qty: null,
      supplier_orders: {
        status: 4,
      },
    },
  });

  console.log(details.length);

  for (const detail of details) {
    const scmOrderDetail = await orderDB.procurement_order_details.findFirst({
      where: {
        reference_id: detail.supplier_reference_id,
        procurement_orders: {
          client_order_id: detail.order_id,
        },
      },
    });
    if (!scmOrderDetail) {
      console.log(detail.supplier_reference_id);
      continue;
    }

    const scmDetail = await basicDB.scm_order_details.findFirst({
      where: {
        reference_id: scmOrderDetail.reference_id,
        reference_order_id: detail.order_id,
      },
    });

    if (!scmDetail) {
      console.log(detail.supplier_reference_id);
      continue;
    }

    await procurementDB.supplier_order_details.update({
      where: {
        id: detail.id,
      },
      data: {
        confirm_delivery_qty: scmDetail.delivery_qty,
        actual_delivery_qty: scmDetail.delivery_qty,
        final_qty: scmDetail.delivery_qty,
      },
    });

    await orderDB.procurement_order_details.update({
      where: {
        id: scmOrderDetail.id,
      },
      data: {
        deliver_qty: scmDetail.delivery_qty,
        customer_receive_qty: scmDetail.delivery_qty,
        final_qty: scmDetail.delivery_qty,
      },
    });
  }
};

run();
