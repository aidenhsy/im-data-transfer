import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';

const run = async () => {
  const imProcurement = new IMProcurement();
  const scm = new Scm();

  const data = await imProcurement.supplier_orders.findMany({
    where: {
      status: {
        in: [4, 5],
      },
    },
  });

  let i = 0;
  for (const order of data) {
    i++;
    const orderDetails = await scm.scm_order_details.findFirst({
      where: {
        reference_order_id: order.id,
      },
      include: {
        scm_order: true,
      },
    });

    if (orderDetails?.scm_order?.status !== 3) {
      console.log(order.id);
    }
  }
  console.log(i);
};

run();
