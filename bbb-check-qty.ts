import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const details =
    await database.imProcurementProd.supplier_order_details.findMany({
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        final_qty: true,
        supplier_reference_id: true,
        order_id: true,
      },
    });

  console.log(details.length);

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
      const scmBasic = await database.scmProd.scm_order_details.findFirst({
        where: {
          reference_id: detail.supplier_reference_id,
          reference_order_id: detail.order_id,
        },
      });

      await database.scmOrderProd.procurement_order_details.update({
        where: {
          id: order.id,
        },
        data: {
          final_qty: scmBasic?.delivery_qty,
        },
      });
      await database.imProcurementProd.supplier_order_details.update({
        where: {
          id: detail.id,
        },
        data: {
          final_qty: scmBasic?.delivery_qty,
        },
      });
      console.log(detail.supplier_reference_id, 'qty mismatch');
    }
  }
};

run();
