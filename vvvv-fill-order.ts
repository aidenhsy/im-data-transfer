import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.scmOrderProd.procurement_orders.findMany({
    where: {
      order_date: '2025-12-14',
      type: 3,
    },
    include: {
      procurement_order_details: true,
    },
  });

  let total = 0;
  let zero = 0;
  let nonZero = 0;
  for (const order of orders) {
    console.log(`checking order ${order.client_order_id}`);
    for (const detail of order.procurement_order_details) {
      total++;
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

      if (Number(sortItem.deliver_goods_qty) === 0) {
        zero++;
        await database.scmProd.scm_order_details.update({
          where: {
            id: sortItem.id,
          },
          data: {
            deliver_goods_qty: sortItem.num,
            delivery_qty: sortItem.num,
          },
        });
        await database.scmOrderProd.procurement_order_details.update({
          where: {
            id: detail.id,
          },
          data: {
            deliver_qty: sortItem.num,
            final_qty: sortItem.num,
            customer_receive_qty: sortItem.num,
          },
        });
        await database.imProcurementProd.supplier_order_details.updateMany({
          where: {
            supplier_reference_id: detail.reference_id!,
            order_id: order.client_order_id,
          },
          data: {
            actual_delivery_qty: sortItem.num,
            confirm_delivery_qty: sortItem.num,
            final_qty: sortItem.num,
          },
        });
        console.log(
          `updated deliver goods qty for sort item ${detail.reference_id}`
        );
      } else {
        nonZero++;
      }
    }
  }
  console.log(`total: ${total}, zero: ${zero}, nonZero: ${nonZero}`);
};

run();
