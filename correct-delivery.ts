import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';

// Define the type for the raw query result
interface OrderItemResult {
  id: string;
  supplier_reference_id: string;
}

const run = async () => {
  const imProcurement = new IMProcurement();
  const scm = new Scm();
  const scmOrder = new ScmOrder();

  // Option 1: Using raw SQL to compare two fields in the same record (Recommended)
  const orderItems = await imProcurement.$queryRaw<OrderItemResult[]>`
    SELECT supplier_order_details.id, status, supplier_reference_id FROM supplier_order_details
    JOIN supplier_orders ON supplier_order_details.order_id = supplier_orders.id
    WHERE final_qty != confirm_delivery_qty
    AND actual_delivery_qty IS NOT NULL
    AND order_date='2025-07-14'; 
  `;
  console.log(orderItems.length);
  let num = 0;

  for (const item of orderItems) {
    num++;
    console.log(`${num}/${orderItems.length}`);
    const orderDetail = await scm.scm_order_details.findFirst({
      where: {
        reference_id: item.supplier_reference_id,
      },
    });

    if (!orderDetail) {
      console.log(`Order detail ${item.supplier_reference_id} not found`);
      continue;
    }
    await imProcurement.supplier_order_details.update({
      where: {
        id: item.id,
      },
      data: {
        actual_delivery_qty: orderDetail.delivery_qty,
        confirm_delivery_qty: orderDetail.delivery_qty,
        final_qty: orderDetail.delivery_qty,
      },
    });

    const newOrderDetail = await scmOrder.procurement_order_details.findFirst({
      where: {
        reference_id: orderDetail.reference_id,
      },
      include: {
        procurement_orders: true,
      },
    });
    if (!newOrderDetail) {
      console.log(`New order detail ${orderDetail.reference_id} not found`);
      continue;
    }

    await scmOrder.procurement_order_details.update({
      where: {
        id: newOrderDetail.id,
      },
      data: {
        deliver_qty: orderDetail.delivery_qty,
        customer_receive_qty: orderDetail.delivery_qty,
        final_qty: orderDetail.delivery_qty,
      },
    });
  }

  // Clean up connections
  await imProcurement.$disconnect();
  await scm.$disconnect();
  await scmOrder.$disconnect();
};

run().catch(console.error);
