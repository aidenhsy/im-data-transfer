import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as IMProcurementDev } from './prisma/clients/im-procurement-dev';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const imProcurementDev = new IMProcurementDev();
  const imProcurementProd = new IMProcurement();
  const scmProd = new Scm();
  const scmOrderProd = new ScmOrder();
  const scmPricingProd = new ScmPricing();

  const olderOrderDetails = await imProcurementDev.old_records.findMany();

  const length = olderOrderDetails.length;
  let num = 0;
  for (const olditem of olderOrderDetails) {
    num++;
    console.log(`${num}/${length}`);
    const orderDetailItem = await scmProd.scm_order_details.findFirst({
      where: {
        id: Number(olditem.id),
      },
    });

    if (Number(olditem.order_qty) - Number(orderDetailItem?.delivery_qty) > 0) {
      console.log(
        `checked qty is ${Number(olditem.order_qty)}  vs old qty ${Number(
          orderDetailItem?.delivery_qty
        )}`
      );
    }
  }
};

run();
