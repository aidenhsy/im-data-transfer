import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';

dayjs.extend(utc);

const run = async () => {
  const imProcurementDB = new IMProcurement();
  const scmOrderDB = new ScmOrder();

  const orders = await imProcurementDB.supplier_orders.findMany();
  const scmOrders = await scmOrderDB.procurement_orders.findMany();
  for (const scmOrder of scmOrders) {
    const orderDateString = scmOrder.order_date;
    const createdTime = dayjs(scmOrder.created_at).utc().format('YYYY-MM-DD');

    const correctedTimeCreatedAt = dayjs
      .utc(scmOrder.order_date)
      .hour(7)
      .minute(0)
      .second(0)
      .millisecond(0)
      .toDate();

    if (orderDateString !== createdTime) {
      console.log(
        scmOrder.id,
        orderDateString,
        createdTime,
        correctedTimeCreatedAt
      );
      await scmOrderDB.procurement_orders.update({
        where: { id: scmOrder.id },
        data: { created_at: correctedTimeCreatedAt },
      });
    }
  }

  // for (const order of orders) {
  //   const orderDateString = order.order_date;
  //   const createdTime = dayjs(order.created_at).utc().format('YYYY-MM-DD');

  //   const correctedTimeCreatedAt = dayjs
  //     .utc(order.order_date)
  //     .hour(7)
  //     .minute(0)
  //     .second(0)
  //     .millisecond(0)
  //     .toDate();

  //   if (orderDateString !== createdTime) {
  //     console.log(order.id, orderDateString, createdTime);
  //     await imProcurementDB.supplier_orders.update({
  //       where: { id: order.id },
  //       data: {
  //         created_at: correctedTimeCreatedAt,
  //       },
  //     });
  //   }
  // }
};

run();
