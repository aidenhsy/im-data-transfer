import { PrismaClient as IMProcurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as IMProcurementDev } from '../prisma/clients/im-procurement-dev';
import { PrismaClient as ScmOrder } from '../prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from '../prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from '../prisma/clients/scm-pricing-prod';

const run = async () => {
  const imProcurement = new IMProcurement();
  const imProcurementDev = new IMProcurementDev();
  const scmOrder = new ScmOrder();
  const scm = new Scm();
  const scmPricing = new ScmPricing();

  const orderdetails = await scm.scm_order_details.findMany({
    where: {
      order_id: {
        in: [36462, 36457],
      },
    },
  });

  for (const orderdetail of orderdetails) {
    const imDetail = await imProcurement.supplier_order_details.findFirst({
      where: {
        order_id: orderdetail.reference_order_id!,
        supplier_reference_id: orderdetail.reference_id!,
      },
    });

    await imProcurement.supplier_order_details.update({
      where: {
        id: imDetail?.id,
      },
      data: {
        actual_delivery_qty: orderdetail.delivery_qty,
      },
    });

    const scmDetail = await scmOrder.procurement_order_details.findFirst({
      where: {
        procurement_orders: {
          client_order_id: orderdetail.reference_order_id!,
        },
        reference_id: orderdetail.reference_id!,
      },
    });
    if (!scmDetail) {
      console.log(orderdetail.reference_id, orderdetail.reference_order_id);
      continue;
    }

    await scmOrder.procurement_order_details.update({
      where: {
        id: scmDetail.id,
      },
      data: {
        deliver_qty: orderdetail.delivery_qty,
      },
    });
  }
};
run();
