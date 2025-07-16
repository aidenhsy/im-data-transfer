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

  const scmOrderList = await scmOrderDB.procurement_orders.findMany({
    where: {
      status: {
        in: [4, 5],
      },
    },
    include: {
      procurement_order_details: true,
    },
  });

  const scmDetails = await scmDB.scm_order_details.findMany({
    where: {
      scm_order: {
        delivery_day_info_id: {
          in: ['2025-07-14', '2025-07-15', '2025-07-16'],
        },
      },
    },
  });

  const length = imProcurementOrder.length;
  let count = 0;
  for (const order of imProcurementOrder) {
    count++;
    console.log(`${count}/${length}`);
    // const scmOrder = scmOrderList.find((o) => o.client_order_id === order.id);

    // if (!scmOrder) {
    //   console.log('!!! not found', order.id);
    //   continue;
    // }

    // for (const scmDetail of scmOrder.procurement_order_details) {
    //   const imProcurementDetail = order.supplier_order_details.find(
    //     (detail) => detail.supplier_reference_id === scmDetail.reference_id
    //   );

    //   const scmDetailCheck = scmDetails.find(
    //     (detail) => detail.reference_id === scmDetail.reference_id
    //   );

    //   if (!imProcurementDetail) {
    //     console.log(
    //       '!!! not found imProcurementDetail',
    //       scmDetail.reference_id,
    //       order.id
    //     );
    //     continue;
    //   }

    //   if (!scmDetailCheck) {
    //     console.log(
    //       '!!! not found scmDetailCheck',
    //       scmDetail.reference_id,
    //       order.id
    //     );
    //     continue;
    //   }

    //   await scmOrderDB.procurement_order_details.update({
    //     where: {
    //       id: scmDetail.id,
    //     },
    //     data: {
    //       deliver_qty: scmDetailCheck.delivery_qty,
    //       customer_receive_qty: scmDetailCheck.delivery_qty,
    //       final_qty: scmDetailCheck.delivery_qty,
    //     },
    //   });

    //   await imProcurementDB.supplier_order_details.update({
    //     where: {
    //       id: imProcurementDetail.id,
    //     },
    //     data: {
    //       actual_delivery_qty: scmDetailCheck.delivery_qty,
    //       confirm_delivery_qty: scmDetailCheck.delivery_qty,
    //       final_qty: scmDetailCheck.delivery_qty,
    //     },
    //   });
    // }

    const scmOrder = scmOrderList.find((o) => o.client_order_id === order.id);
    if (!scmOrder) {
      console.log('!!! not found scmOrder', order.id);
      continue;
    }

    const scmFinal = scmOrder.procurement_order_details.reduce((acc, curr) => {
      return acc + Number(curr.final_qty) * Number(curr.price);
    }, 0);

    const imProcurementFinal = order.supplier_order_details.reduce(
      (acc, curr) => {
        return acc + Number(curr.final_qty) * Number(curr.price);
      },
      0
    );

    // Use tolerance-based comparison (0.01 for 2 decimal place precision)
    const tolerance = 0.01;
    const difference = Math.abs(scmFinal - imProcurementFinal);

    if (difference >= tolerance) {
      console.log(scmFinal, imProcurementFinal, order.id);
      console.log('Difference:', difference);
    }
  }

  // Clean up connections
  await imProcurementDB.$disconnect();
  await scmDB.$disconnect();
  await scmOrderDB.$disconnect();
  console.log('done');
  process.exit(0);
};

run().catch(console.error);
