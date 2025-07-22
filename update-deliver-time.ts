import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';

const run = async () => {
  const scm = new Scm();
  const imProcurement = new IMProcurement();
  const scmOrder = new ScmOrder();

  const scmOrders = await scmOrder.procurement_orders.findMany();
  const missingOrders = await imProcurement.supplier_orders.findMany({
    where: {
      id: {
        notIn: scmOrders.map((item) => item.id),
      },
    },
  });

  console.log(missingOrders);

  console.log(missingOrders.length);
};

run();
