import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as IMProcurementDev } from './prisma/clients/im-procurement-dev';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const imProcurementDB = new IMProcurement();
  const scmOrderDB = new ScmOrder();
  const scmDB = new Scm();

  const supplierOrders = await imProcurementDB.supplier_orders.findMany();

  for (const order of supplierOrders) {
    const scm = await scmDB.scm_order_details.findFirst({
      where: {
        reference_order_id: order.id,
      },
    });

    if (!scm) {
      console.log(order.id);
    }
  }
};

run();
