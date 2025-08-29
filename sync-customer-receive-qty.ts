import { DatabaseService } from './database';

const run = async () => {
  const db = new DatabaseService();

  const details = await db.scmOrderProd.procurement_order_details.findMany({
    orderBy: {
      created_at: 'desc',
    },
    select: {
      id: true,
      reference_id: true,
      procurement_orders: {
        select: {
          client_order_id: true,
        },
      },
    },
  });
  console.log(details.length);
  for (const detail of details) {
    const proDetail =
      await db.imProcurementProd.supplier_order_details.findFirst({
        where: {
          supplier_reference_id: detail.reference_id!,
          order_id: detail.procurement_orders.client_order_id!,
        },
      });

    if (!proDetail) {
      console.log(detail.reference_id, 'proDetail not found');
      continue;
    }

    await db.scmOrderProd.procurement_order_details.update({
      where: { id: detail.id },
      data: { customer_receive_qty: proDetail.confirm_delivery_qty },
    });
  }
};

run();
