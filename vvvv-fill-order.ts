import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.scmOrderProd.procurement_orders.findMany({
    where: {
      order_date: '2025-12-16',
      type: 9,
    },
    include: {
      procurement_order_details: true,
    },
  });

  for (const order of orders) {
    console.log(`checking order ${order.client_order_id}`);
    for (const detail of order.procurement_order_details) {
      const sortItem = await database.scmProd.scm_order_details.findFirst({
        where: {
          reference_order_id: order.client_order_id,
          reference_id: detail.reference_id,
        },
      });
      if (!sortItem) {
        console.log(`sort item ${detail.reference_id} not found`);
        continue;
      }

      await database.scmOrderProd.procurement_order_details.update({
        where: {
          id: detail.id,
        },
        data: {
          deliver_qty: sortItem.deliver_goods_qty,
          final_qty: sortItem.deliver_goods_qty,
          customer_receive_qty: sortItem.deliver_goods_qty,
        },
      });

      await database.imProcurementProd.supplier_order_details.updateMany({
        where: {
          supplier_reference_id: detail.reference_id!,
          order_id: order.client_order_id,
        },
        data: {
          actual_delivery_qty: sortItem.deliver_goods_qty,
          confirm_delivery_qty: sortItem.deliver_goods_qty,
          final_qty: sortItem.deliver_goods_qty,
        },
      });
    }
  }
};

run();
