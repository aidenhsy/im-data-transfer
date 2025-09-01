import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const details =
    await database.imProcurementProd.supplier_order_details.findMany({
      orderBy: {
        created_at: 'desc',
      },
      select: {
        final_qty: true,
        supplier_reference_id: true,
        order_id: true,
      },
      take: 2000,
    });

  for (const detail of details) {
    const order =
      await database.scmOrderProd.procurement_order_details.findFirst({
        where: {
          reference_id: detail.supplier_reference_id,
          procurement_orders: {
            client_order_id: detail.order_id,
          },
        },
      });

    if (!order) {
      console.log(detail.supplier_reference_id, 'no order');
      continue;
    }

    if (Number(order.final_qty) !== Number(detail.final_qty)) {
      console.log(detail.supplier_reference_id, 'qty mismatch');
    }
  }
};

run();
