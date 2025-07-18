import { PrismaClient as ScmDB } from '../prisma/clients/scm-prod';
import { PrismaClient as ImProcurementDB } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrderDB } from '../prisma/clients/scm-order-prod';

const run = async () => {
  const scmOrderDB = new ScmOrderDB();
  const scmDB = new ScmDB();
  const imProcurementDB = new ImProcurementDB();

  const orders = await imProcurementDB.supplier_orders.findMany({
    where: {
      status: {
        in: [4, 5],
      },
    },
    include: {
      supplier_order_details: true,
    },
  });

  const length = orders.length;
  let count = 0;

  for (const order of orders) {
    count++;
    console.log(`${count}/${length}`);

    for (const detail of order.supplier_order_details) {
      const orderDetail = await scmDB.scm_order_details.findMany({
        where: {
          reference_order_id: order.id,
          reference_id: detail.supplier_reference_id,
        },
      });

      if (orderDetail.length === 0) {
        console.log(order.id, detail.supplier_reference_id, '!!!!');
        continue;
      }
      if (orderDetail.length > 1) {
        console.log(order.id, detail.supplier_reference_id, '!!!!');
        continue;
      }
      if (Number(detail.final_qty) !== Number(orderDetail[0].delivery_qty)) {
        console.log('name:', orderDetail[0].goods_name);
        console.log('im order', detail.order_qty);
        console.log('im delivery', detail.actual_delivery_qty);
        console.log('im receive', detail.confirm_delivery_qty);
        console.log('im final:', detail.final_qty);
        console.log('scm number:', orderDetail[0].num);
        console.log('scm delivery:', orderDetail[0].deliver_goods_qty);
        console.log('scm final:', orderDetail[0].delivery_qty);
        console.log('--------------------------------');
      }
    }
  }
};

run();
