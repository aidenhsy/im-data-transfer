import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';

const run = async () => {
  const procurement = new Procurement();

  const orderDetails = await procurement.supplier_order_details.findMany({
    where: {
      confirm_delivery_qty: null,
      supplier_orders: {
        status: 20,
      },
    },
  });

  // Extract unique order IDs
  const uniqueOrderIds = [
    ...new Set(orderDetails.map((detail) => detail.order_id)),
  ];

  console.log(uniqueOrderIds.length);

  for (const detail of orderDetails) {
    await procurement.supplier_order_details.update({
      where: {
        id: detail.id,
      },
      data: {
        confirm_delivery_qty: detail.actual_delivery_qty,
      },
    });
  }

  // for (const orderId of uniqueOrderIds) {
  const order = await procurement.supplier_orders.findFirst({
    where: {
      id: '9d8f2e0d-0d24-45f5-aead-2541659fca99',
    },
    include: {
      supplier_order_details: true,
    },
  });

  let mismatch = 0;
  for (const detail of order?.supplier_order_details!) {
    if (
      Number(detail.confirm_delivery_qty) !== Number(detail.actual_delivery_qty)
    ) {
      mismatch++;
      console.log(detail.confirm_delivery_qty, detail.actual_delivery_qty);
    }
  }
  if (mismatch === 0) {
    await procurement.supplier_orders.update({
      where: {
        id: order?.id,
      },
      data: {
        status: 4,
      },
    });
  }
  // if (mismatch === 0) {
  //   console.log(orderId);
  // }
  // }
};

run();
