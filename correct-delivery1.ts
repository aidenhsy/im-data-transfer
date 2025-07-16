import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';

// Define the type for the raw query result
interface OrderItemResult {
  id: string;
  supplier_reference_id: string;
}

const run = async () => {
  const imProcurementDB = new IMProcurement();
  const scmDB = new Scm();
  const scmOrderDB = new ScmOrder();

  const imProcurementOrder = await imProcurementDB.supplier_orders.findMany({
    where: {
      status: {
        in: [4, 5],
      },
    },
    include: {
      supplier_order_details: true,
    },
  });

  console.log(imProcurementOrder.length);
  for (const order of imProcurementOrder) {
    for (const detail of order.supplier_order_details) {
      if (detail.final_qty === null) {
        await imProcurementDB.supplier_order_details.update({
          where: {
            id: detail.id,
          },
          data: {
            final_qty: detail.confirm_delivery_qty,
          },
        });
      }
    }
    // const scmOrder = await scmOrderDB.procurement_orders.findFirst({
    //   where: {
    //     client_order_id: order.id,
    //   },
    //   include: {
    //     procurement_order_details: true,
    //   },
    // });

    // if (!scmOrder) {
    //   console.log('!!! not found', order.id);
    //   continue;
    // }

    // const scmFinal = scmOrder.procurement_order_details.reduce((acc, curr) => {
    //   return acc + Number(curr.final_qty) * Number(curr.price);
    // }, 0);

    // const imProcurementFinal = order.supplier_order_details.reduce(
    //   (acc, curr) => {
    //     return acc + Number(curr.final_qty) * Number(curr.price);
    //   },
    //   0
    // );

    // console.log(scmFinal, imProcurementFinal, order.id);
  }

  // Clean up connections
  await imProcurementDB.$disconnect();
  await scmDB.$disconnect();
  await scmOrderDB.$disconnect();
  console.log('done');
  process.exit(0);
};

run().catch(console.error);
