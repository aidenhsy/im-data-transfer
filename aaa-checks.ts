import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from './prisma/clients/scm-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';

const run = async () => {
  const procurementDB = new Procurement();
  const basicDB = new Basic();
  const orderDB = new Order();

  const imOrders = await procurementDB.supplier_order_details.findMany({
    where: {
      supplier_orders: {
        created_at: {
          gt: '2025-08-21T00:00:00.000Z',
          lt: '2025-08-21T23:59:59.999Z',
        },
      },
    },
  });

  console.log(imOrders.length);
  const length = imOrders.length;
  let index = 0;

  for (const imOrder of imOrders) {
    if (index % 100 === 0) {
      console.log(`处理第 ${index} 条订单，${length - index} 条未处理`);
    }
    index++;

    const scmDetail = await orderDB.procurement_order_details.findFirst({
      where: {
        procurement_orders: {
          client_order_id: imOrder.order_id,
        },
        reference_id: imOrder.supplier_reference_id,
      },
    });

    if (!scmDetail) {
      console.log(imOrder.order_id, imOrder.supplier_reference_id);
      continue;
    }

    const scmProd = await basicDB.scm_order_details.findFirst({
      where: {
        reference_id: imOrder.supplier_reference_id,
        reference_order_id: imOrder.order_id,
      },
    });

    if (!scmProd) {
      console.log(imOrder.order_id, imOrder.supplier_reference_id);
      continue;
    }

    if (Number(scmProd.deliver_goods_qty) !== Number(scmDetail.deliver_qty)) {
      console.log(scmProd.deliver_goods_qty, scmDetail.deliver_qty);
    }
  }
};

run();
