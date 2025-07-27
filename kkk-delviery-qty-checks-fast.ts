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
    // where: {
    // status: {
    //   in: [2, 4, 5, 20],
    // },
    // },
  });

  while (hasMoreData) {
    console.log(`${skip}/${total}`);

    const procurementOrders = await procurement.supplier_orders.findMany({
      orderBy: {
        created_at: 'desc',
      },
      // where: {
      // status: {
      //   in: [2, 4, 5, 20],
      // },
      // },
      include: {
        supplier_order_details: true,
      },
      take: pageSize,
      skip: skip,
    });

    if (procurementOrders.length === 0) {
      break;
    }

    if (procurementOrders.length < pageSize) {
      hasMoreData = false;
    }

    // Extract all reference IDs and order IDs for batch queries
    const referenceIds = new Set();
    const orderIds = new Set();
    const detailMap = new Map(); // Map for quick lookups

    for (const procurementOrder of procurementOrders) {
      orderIds.add(procurementOrder.id);
      for (const detail of procurementOrder.supplier_order_details) {
        referenceIds.add(detail.supplier_reference_id);
        detailMap.set(
          `${procurementOrder.id}-${detail.supplier_reference_id}`,
          {
            procurementOrder,
            procurementDetail: detail,
          }
        );
      }
    }

    // Batch fetch all related records
    const [scmDetails, scmBasics] = await Promise.all([
      order.procurement_order_details.findMany({
        where: {
          reference_id: {
            in: Array.from(referenceIds) as string[],
          },
          procurement_orders: {
            client_order_id: {
              in: Array.from(orderIds) as string[],
            },
          },
        },
        include: {
          procurement_orders: true,
        },
      }),
      basic.scm_order_details.findMany({
        where: {
          reference_id: {
            in: Array.from(referenceIds) as string[],
          },
          reference_order_id: {
            in: Array.from(orderIds) as string[],
          },
        },
      }),
    ]);

    // Create lookup maps for O(1) access
    const scmDetailMap = new Map();
    const scmBasicMap = new Map();

    scmDetails.forEach((detail) => {
      const key = `${detail.procurement_orders.client_order_id}-${detail.reference_id}`;
      scmDetailMap.set(key, detail);
    });

    scmBasics.forEach((basic) => {
      const key = `${basic.reference_order_id}-${basic.reference_id}`;
      scmBasicMap.set(key, basic);
    });

    // Collect updates for batch processing
    const procurementUpdates = [];
    const orderUpdates = [];

    // Process all combinations
    for (const [key, { procurementOrder, procurementDetail }] of detailMap) {
      const scmDetail = scmDetailMap.get(key);
      const scmBasic = scmBasicMap.get(key);

      if (!scmDetail) {
        console.log(
          `${procurementOrder.id} ${procurementDetail.supplier_reference_id} scm order missing`
        );
        continue;
      }

      if (!scmBasic) {
        // console.log(
        //   `${procurementOrder.id} ${procurementDetail.supplier_reference_id} scm basic missing`
        // );
        await order.procurement_order_details.update({
          where: { id: scmDetail.id },
          data: { deliver_qty: Number(procurementDetail.actual_delivery_qty) },
        });
        continue;
      }

      const deliverGoodsQty = Number(scmBasic.deliver_goods_qty);
      const deliverQty = Number(scmDetail.deliver_qty);
      const actualDeliveryQty = Number(procurementDetail.actual_delivery_qty);

      if (
        deliverGoodsQty !== deliverQty ||
        deliverGoodsQty !== actualDeliveryQty
      ) {
        procurementUpdates.push({
          where: { id: procurementDetail.id },
          data: { actual_delivery_qty: deliverGoodsQty },
        });

        orderUpdates.push({
          where: { id: scmDetail.id },
          data: { deliver_qty: deliverGoodsQty },
        });
      }
    }

    // Batch execute updates
    if (procurementUpdates.length > 0 || orderUpdates.length > 0) {
      await Promise.all([
        // Use transactions for batch updates
        procurement.$transaction(
          procurementUpdates.map((update) =>
            procurement.supplier_order_details.update(update)
          )
        ),
        order.$transaction(
          orderUpdates.map((update) =>
            order.procurement_order_details.update(update)
          )
        ),
      ]);

      console.log(
        `Updated ${procurementUpdates.length} procurement records and ${orderUpdates.length} order records`
      );
    }

    totalProcessed += procurementOrders.length;
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
