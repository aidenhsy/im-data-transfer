import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from './prisma/clients/scm-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';

const run = async () => {
  const procurement = new Procurement();
  const basic = new Basic();
  const order = new Order();

  const pageSize = 100;
  let skip = 0;
  let hasMoreData = true;
  let totalProcessed = 0;

  const total = await procurement.supplier_orders.count({
    where: {
      status: {
        in: [2, 4, 5, 20],
      },
    },
  });
  while (hasMoreData) {
    console.log(`${skip}/${total}`);
    const procurementOrders = await procurement.supplier_orders.findMany({
      orderBy: {
        created_at: 'desc',
      },
      where: {
        status: {
          in: [2, 4, 5, 20],
        },
      },
      include: {
        supplier_order_details: true,
      },
      take: pageSize,
      skip: skip,
    });

    // If we get fewer records than pageSize, this is the last page
    if (procurementOrders.length < pageSize) {
      hasMoreData = false;
    }

    // If no records returned, break out of loop
    if (procurementOrders.length === 0) {
      break;
    }

    totalProcessed += procurementOrders.length;

    for (const procurementOrder of procurementOrders) {
      for (const procurementDetail of procurementOrder.supplier_order_details) {
        const scmDetail = await order.procurement_order_details.findFirst({
          where: {
            reference_id: procurementDetail.supplier_reference_id,
            procurement_orders: {
              client_order_id: procurementOrder.id,
            },
          },
        });

        const scmBasic = await basic.scm_order_details.findFirst({
          where: {
            reference_id: procurementDetail.supplier_reference_id,
            reference_order_id: procurementOrder.id,
          },
        });

        if (!scmDetail) {
          console.log(
            `${procurementOrder.id} ${procurementDetail.supplier_reference_id} scm order missing`
          );
          continue;
        }

        if (!scmBasic) {
          console.log(
            `${procurementOrder.id} ${procurementDetail.supplier_reference_id} scm basic missing`
          );
          continue;
        }

        if (
          Number(scmBasic.deliver_goods_qty) !==
            Number(scmDetail.deliver_qty) ||
          Number(scmBasic.deliver_goods_qty) !==
            Number(procurementDetail.actual_delivery_qty)
        ) {
          // console.log(
          //   `${procurementOrder.id} ${procurementDetail.supplier_reference_id} \n current status: ${procurementOrder.status} \n scm order: ${scmDetail.deliver_qty} \n scm basic: ${scmBasic.deliver_goods_qty} \n procurement: ${procurementDetail.actual_delivery_qty}`
          // );
          // console.log('--------------------------------');

          await procurement.supplier_order_details.update({
            where: {
              id: procurementDetail.id,
            },
            data: {
              actual_delivery_qty: Number(scmBasic.deliver_goods_qty),
            },
          });

          await order.procurement_order_details.update({
            where: {
              id: scmDetail.id,
            },
            data: {
              deliver_qty: Number(scmBasic.deliver_goods_qty),
            },
          });
        }
      }
    }

    // Move to next page
    skip += pageSize;
  }

  console.log(`Processing complete. Total orders processed: ${totalProcessed}`);

  // Close database connections
  await procurement.$disconnect();
  await basic.$disconnect();
  await order.$disconnect();
};

run().catch((error) => {
  console.error('Error running script:', error);
  process.exit(1);
});
