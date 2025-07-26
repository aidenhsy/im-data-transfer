import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';

const run = async () => {
  const imProcurement = new IMProcurement();
  const scmOrder = new ScmOrder();
  const scm = new Scm();

  const orderDetails = await imProcurement.supplier_order_details.findMany({
    where: {
      confirm_delivery_qty: null,
      supplier_orders: {
        status: 20,
      },
    },
  });

  for (const detail of orderDetails) {
    const scmDetail = await scmOrder.procurement_order_details.findFirst({
      where: {
        reference_id: detail.supplier_reference_id,
        procurement_orders: {
          client_order_id: detail.order_id,
        },
      },
    });
    if (!scmDetail) {
      console.log(detail.id);
      continue;
    }

    await imProcurement.supplier_order_details.update({
      where: {
        id: detail.id,
      },
      data: {
        confirm_delivery_qty: scmDetail.deliver_qty,
      },
    });

    await scmOrder.procurement_order_details.update({
      where: {
        id: scmDetail.id,
      },
      data: {
        customer_receive_qty: scmDetail.deliver_qty,
      },
    });
  }
};
run();
