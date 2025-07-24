import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';

const run = async () => {
  const imProcurement = new IMProcurement();
  const scmOrder = new ScmOrder();
  const scm = new Scm();

  const scmProdOrders = await scm.scm_order_details.findMany({
    where: {
      reference_order_id: {
        not: null,
      },
    },
  });

  for (const order of scmProdOrders) {
    const imProcurementDetail =
      await imProcurement.supplier_order_details.findFirst({
        where: {
          order_id: order.reference_order_id!,
          supplier_reference_id: order.reference_id!,
        },
      });
    if (!imProcurementDetail) {
      console.log('!! no procurement');
      continue;
    }
    const correspondingScmOrder =
      await scmOrder.procurement_order_details.findFirst({
        where: {
          reference_id: imProcurementDetail.supplier_reference_id,
          procurement_orders: {
            client_order_id: imProcurementDetail.order_id,
          },
        },
      });
    if (!correspondingScmOrder) {
      console.log('!! no scm order');
      continue;
    }

    if (!correspondingScmOrder.deliver_qty) {
      await scmOrder.procurement_order_details.update({
        where: {
          id: correspondingScmOrder.id,
        },
        data: {
          deliver_qty: order.deliver_goods_qty,
        },
      });
    }
    if (!correspondingScmOrder.deliver_qty) {
      await scmOrder.procurement_order_details.update({
        where: {
          id: correspondingScmOrder.id,
        },
        data: {
          deliver_qty: order.deliver_goods_qty,
        },
      });
    }
  }
};
run();
