import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const returnItems =
    await database.scmOrderProd.procurement_order_return_details.findMany({
      where: {
        procurement_order_returns: {
          status: 1,
        },
      },
      include: {
        procurement_order_details: {
          include: {
            procurement_orders: true,
          },
        },
      },
    });

  for (const item of returnItems) {
    const finalQty =
      Number(item.procurement_order_details.customer_receive_qty) -
      Number(item.qty_returned);

    if (finalQty < 0) {
      console.log('qty returned: ', item.qty_returned);
      console.log('total value: ', item.total_value);
      console.log({
        reference_id: item.procurement_order_details.reference_id!,
        order_id:
          item.procurement_order_details.procurement_orders.client_order_id,
      });
      const imProcurementDetail =
        await database.imProcurementProd.supplier_order_details.findFirst({
          where: {
            supplier_reference_id: item.procurement_order_details.reference_id!,
            order_id:
              item.procurement_order_details.procurement_orders.client_order_id,
          },
        });

      await database.scmOrderProd.procurement_order_return_details.update({
        where: {
          id: item.id,
        },
        data: {
          qty_returned: 0,
        },
      });
      await database.imProcurementProd.supplier_order_return_details.update({
        where: {
          source_detail_id: imProcurementDetail?.id,
        },
        data: {
          qty_returned: 0,
        },
      });
      const scmOrderDetail = await database.scmProd.scm_order_details.findFirst(
        {
          where: {
            reference_id: item.procurement_order_details.reference_id!,
            reference_order_id:
              item.procurement_order_details.procurement_orders.client_order_id,
          },
        }
      );
      await database.scmProd.scm_order_details.update({
        where: {
          id: scmOrderDetail?.id,
        },
        data: {
          sales_return_qty: 0,
        },
      });
      await database.scmProd.scm_return_goods.updateMany({
        where: {
          order_detail_id: scmOrderDetail?.id,
        },
        data: {
          qty: 0,
        },
      });
    }

    await database.scmOrderProd.procurement_order_details.update({
      where: {
        id: item.source_detail_id,
      },
      data: {
        final_qty: finalQty,
      },
    });
    await database.imProcurementProd.supplier_order_details.update({
      where: {
        supplier_reference_id_order_id: {
          supplier_reference_id: item.procurement_order_details.reference_id!,
          order_id:
            item.procurement_order_details.procurement_orders.client_order_id,
        },
      },
      data: {
        final_qty: finalQty,
      },
    });
  }

  console.log('Processing completed successfully');
  await database.disconnect();
  process.exit(0);
};

run();
