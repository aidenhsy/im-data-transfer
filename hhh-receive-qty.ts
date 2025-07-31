import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from './prisma/clients/scm-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';

const run = async () => {
  const procurementDB = new Procurement();
  const basicDB = new Basic();
  const orderDB = new Order();

  const batchSize = 100;
  let skip = 0;
  let hasMoreOrders = true;
  while (hasMoreOrders) {
    const orders = await orderDB.procurement_orders.findMany({
      where: {
        status: {
          in: [4, 5, 20],
        },
      },
      take: batchSize,
      skip: skip,
    });

    if (orders.length < batchSize) {
      hasMoreOrders = false;
    }

    if (orders.length === 0) {
      break;
    }

    const procurementOrders = await procurementDB.supplier_orders.findMany({
      where: {
        id: {
          in: orders.map((order) => order.client_order_id),
        },
      },
    });

    for (const order of orders) {
      const procurementOrder = procurementOrders.find(
        (o) => o.id === order.client_order_id
      );
      if (!procurementOrder) {
        console.log(`${order.client_order_id} not found`);
        continue;
      }

      if (procurementOrder.receive_time && order.customer_receive_time) {
        continue;
      }

      console.log(
        `${order.client_order_id} \n ${order.status} \n ${procurementOrder.receive_time} \n ${order.customer_receive_time}`
      );
      console.log('-----------');

      if (procurementOrder?.receive_time) {
        await orderDB.procurement_orders.update({
          where: {
            id: order.id,
          },
          data: {
            customer_receive_time: procurementOrder.receive_time,
          },
        });
      }

      if (procurementOrder.receive_time === null) {
        await procurementDB.supplier_orders.update({
          where: {
            id: procurementOrder.id,
          },
          data: {
            receive_time: order.delivery_time,
          },
        });
        await orderDB.procurement_orders.update({
          where: {
            id: order.id,
          },
          data: {
            customer_receive_time: order.delivery_time,
          },
        });
      }
    }

    // Move to the next batch
    skip += batchSize;
  }
};

run();
