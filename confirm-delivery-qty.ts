import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';

const run = async () => {
  const imProcurement = new IMProcurement();
  const scmOrder = new ScmOrder();
  const scm = new Scm();

  const orders = await imProcurement.supplier_orders.findMany({
    where: {
      status: 20,
    },
    include: {
      supplier_order_details: true,
    },
  });

  for (const order of orders) {
    let missMatch = 0;
    for (const detail of order.supplier_order_details) {
      if (
        Number(detail.confirm_delivery_qty) !==
        Number(detail.actual_delivery_qty)
      ) {
        missMatch++;
      }
    }
    if (missMatch === 0) {
      console.log(order.id);
    }
  }
};
run();
