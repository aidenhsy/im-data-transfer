import axios from 'axios';
import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.scmProd.scm_order.findMany({
    where: {
      status: 3,
      delivery_day_info_id: '2025-12-13',
      automatic: 1,
    },
    select: {
      id: true,
      scm_order_details: {
        select: {
          reference_id: true,
          reference_order_id: true,
          num: true,
          deliver_goods_qty: true,
          delivery_qty: true,
          delivery_time: true,
        },
      },
    },
  });

  for (const order of orders) {
    console.log(order.id);
    for (const detail of order.scm_order_details) {
      if (Number(detail.deliver_goods_qty) !== Number(detail.delivery_qty)) {
        console.log(
          detail.reference_id,
          detail.deliver_goods_qty,
          detail.delivery_qty
        );
        continue;
      }
      await database.scmOrderProd.procurement_order_details.updateMany({
        where: {
          reference_id: detail.reference_id,
          procurement_orders: {
            client_order_id: detail.reference_order_id!,
          },
        },
        data: {
          customer_receive_qty: detail.delivery_qty,
          deliver_qty: detail.deliver_goods_qty,
          final_qty: detail.delivery_qty,
        },
      });
      await database.scmOrderProd.procurement_orders.update({
        where: {
          client_order_id: detail.reference_order_id!,
        },
        data: {
          delivery_time: detail.delivery_time,
          sent_time: detail.delivery_time,
          estimated_delivery_time: detail.delivery_time,
          customer_receive_time: detail.delivery_time,
        },
      });
    }
  }
  console.log('Order received');
};

run();
