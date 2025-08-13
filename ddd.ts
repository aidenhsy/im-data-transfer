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
          reference_order_id: order.id,
        },
        select: {
          delivery_qty: true,
          scm_order: {
            select: {
              receival_time: true,
            },
          },
        },
      });
      if (!scmItem) {
        console.log(detail.supplier_reference_id, rest.id, 'not found');
      }

      const receivalTime = scmItem?.scm_order?.receival_time
        ? new Date(scmItem.scm_order.receival_time)
        : null;
      const receiveTime = order.receive_time
        ? new Date(order.receive_time)
        : null;

      if (
        receivalTime &&
        receiveTime &&
        receivalTime.getTime() !== receiveTime.getTime()
      ) {
        console.log(receivalTime.toISOString(), receiveTime.toISOString());
      }

      if (Number(scmItem?.delivery_qty) !== Number(final_qty)) {
        console.log(scmItem?.delivery_qty, final_qty);
      }
    }
  }
};

run();
