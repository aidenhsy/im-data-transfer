import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from './prisma/clients/scm-prod';

const run = async () => {
  const procurement = new Procurement();
  const basic = new Basic();

  const orders = await procurement.supplier_orders.findMany({
    where: {
      receive_time: {
        gt: '2025-07-01T00:00:00.000Z',
        lt: '2025-07-31T23:59:59.999Z',
      },
      status: {
        in: [4, 5],
      },
    },
    include: {
      supplier_order_details: true,
    },
  });

  for (const order of orders) {
    const { supplier_order_details, ...rest } = order;

    for (const detail of supplier_order_details) {
      const { final_qty, ...rest } = detail;

      const scmItem = await basic.scm_order_details.findFirst({
        where: {
          reference_id: detail.supplier_reference_id,
          reference_order_id: rest.id,
        },
      });
      if (!scmItem) {
        console.log(detail.supplier_reference_id, rest.id, 'not found');
      }

      if (Number(scmItem?.delivery_qty) !== Number(final_qty)) {
        console.log(scmItem?.delivery_qty, final_qty);
      }
    }
  }
};

run();
