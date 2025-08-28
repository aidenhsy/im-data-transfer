import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const details =
    await database.imProcurementProd.supplier_order_details.findMany({
      where: {
        supplier_orders: {
          receive_time: {
            gte: new Date('2025-08-01T00:00:00.000Z'),
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        supplier_reference_id: true,
        order_id: true,
        final_qty: true,
      },
    });

  console.log(details.length);

  for (const detail of details) {
    const basicDetail = await database.scmProd.scm_order_details.findFirst({
      where: {
        reference_id: detail.supplier_reference_id,
        reference_order_id: detail.order_id,
      },
    });

    if (!basicDetail) {
      console.log('!!! not found');
      continue;
    }

    const orderDetail =
      await database.scmOrderProd.procurement_order_details.findFirst({
        where: {
          reference_id: detail.supplier_reference_id,
          procurement_orders: {
            client_order_id: detail.order_id,
          },
        },
      });

    if (!orderDetail) {
      console.log('!!! not found');
      continue;
    }
    if (
      Number(detail.final_qty) !== Number(orderDetail.final_qty) &&
      Number(detail.final_qty) !== Number(basicDetail.delivery_qty)
    ) {
      await database.imProcurementProd.supplier_order_details.update({
        where: {
          id: detail.id,
        },
        data: {
          actual_delivery_qty: basicDetail.deliver_goods_qty,
          confirm_delivery_qty: basicDetail.delivery_qty,
          final_qty: basicDetail.delivery_qty,
        },
      });
      await database.scmOrderProd.procurement_order_details.update({
        where: {
          id: orderDetail.id,
        },
        data: {
          deliver_qty: basicDetail.deliver_goods_qty,
          customer_receive_qty: basicDetail.delivery_qty,
          final_qty: basicDetail.delivery_qty,
        },
      });
    }
  }
};

run();
