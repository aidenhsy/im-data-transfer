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

    const scmOrderOrder = await scmOrderDB.procurement_orders.findFirst({
      where: {
        client_order_id: order.id,
      },
    });

    if (!scmOrderOrder) {
      console.log(order.id, '!!!!');
      continue;
    }

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

      const scmOrderOrderDetail =
        await scmOrderDB.procurement_order_details.findFirst({
          where: {
            order_id: scmOrderOrder.id,
            reference_id: detail.supplier_reference_id,
          },
        });

      if (!scmOrderOrderDetail) {
        console.log(order.id, detail.supplier_reference_id, '!!!!');
        continue;
      }

      if (Number(detail.final_qty) !== Number(orderDetail[0].delivery_qty)) {
        console.log('name:', orderDetail[0].goods_name);
        console.log('im order', detail.order_qty);
        console.log('im delivery', detail.actual_delivery_qty);
        console.log('im receive', detail.confirm_delivery_qty);
        console.log('im final:', detail.final_qty);
        console.log('scm order:', orderDetail[0].num);
        console.log('scm delivery:', orderDetail[0].deliver_goods_qty);
        console.log('scm final:', orderDetail[0].delivery_qty);
        console.log('scm id:', orderDetail[0].id);
        console.log('--------------------------------');
        await imProcurementDB.supplier_order_details.update({
          where: {
            id: detail.id,
          },
          data: {
            confirm_delivery_qty: orderDetail[0].deliver_goods_qty,
            actual_delivery_qty: orderDetail[0].deliver_goods_qty,
            final_qty: orderDetail[0].delivery_qty,
          },
        });
        await scmOrderDB.procurement_order_details.update({
          where: {
            id: scmOrderOrderDetail.id,
          },
          data: {
            deliver_qty: orderDetail[0].delivery_qty,
            customer_receive_qty: orderDetail[0].delivery_qty,
            final_qty: orderDetail[0].delivery_qty,
          },
        });
      }
    }

    const refreshedOrder = await imProcurementDB.supplier_orders.findFirst({
      where: {
        id: order.id,
      },
      include: {
        supplier_order_details: true,
      },
    });

    const orderAmount = refreshedOrder?.supplier_order_details.reduce(
      (acc, detail) => acc + Number(detail.order_qty) * Number(detail.price),
      0
    );
    const finalAmount = refreshedOrder?.supplier_order_details.reduce(
      (acc, detail) => acc + Number(detail.final_qty) * Number(detail.price),
      0
    );

    await imProcurementDB.supplier_orders.update({
      where: {
        id: order.id,
      },
      data: {
        order_amount: orderAmount?.toFixed(2),
        actual_amount: finalAmount?.toFixed(2),
      },
    });

    await scmOrderDB.procurement_orders.update({
      where: {
        id: scmOrderOrder.id,
      },
      data: {
        order_amount: orderAmount?.toFixed(2),
        actual_amount: finalAmount?.toFixed(2),
      },
    });
  }
};

run();
