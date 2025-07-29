import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';

const run = async () => {
  const scm = new Scm();
  const imProcurement = new IMProcurement();
  const scmOrder = new ScmOrder();

  const scmOrders = await scmOrder.procurement_orders.findMany();
  const imProcurementOrders = await imProcurement.supplier_orders.findMany();

  const missingScmOrders = imProcurementOrders.filter(
    (item) => !scmOrders.some((scm) => scm.client_order_id === item.id)
  );

  const missingImProcurementOrders = scmOrders.filter(
    (item) => !imProcurementOrders.some((im) => im.id === item.client_order_id)
  );

  console.log(missingScmOrders.length, 'missingScmOrders');
  console.log(missingScmOrders.map((item) => item.id));
  console.log(missingImProcurementOrders.length, 'missingImProcurementOrders');
};

run();
