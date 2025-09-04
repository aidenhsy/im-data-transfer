import { DatabaseService } from './database';

type MissingObj = { reference_order_id: string; reference_id: string };

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.imProcurementProd.supplier_orders.findMany({
    where: {
      receive_time: null,
      status: {
        in: [4, 5],
      },
    },
    include: {
      supplier_order_details: true,
    },
  });

  const scmOrders = await database.scmOrderProd.procurement_orders.findMany({
    where: {
      customer_receive_time: null,
      status: {
        in: [4, 5],
      },
    },
    include: {
      procurement_order_details: true,
    },
  });

  // Build arrays independently (no need for if (length > 0))
  const fromSupplier: MissingObj[] = orders.flatMap((o) =>
    o.supplier_order_details
      .filter((d) => d.supplier_reference_id) // guard nulls
      .map((d) => ({
        reference_order_id: d.order_id,
        reference_id: d.supplier_reference_id!,
      }))
  );

  const fromScm: MissingObj[] = scmOrders.flatMap((o) =>
    o.procurement_order_details
      .filter((d) => d.reference_id)
      .map((d) => ({
        reference_order_id: o.client_order_id, // keep using client_order_id as you intended
        reference_id: d.reference_id!,
      }))
  );

  // Combine
  const missingObjs: MissingObj[] = [...fromSupplier, ...fromScm];

  for (const missingObj of missingObjs) {
    const scmDetail = await database.scmProd.scm_order_details.findFirst({
      where: {
        reference_id: missingObj.reference_id,
        reference_order_id: missingObj.reference_order_id,
      },
      include: {
        scm_order: true,
      },
    });
    if (!scmDetail) {
      console.log(missingObj.reference_id, missingObj.reference_order_id);
      continue;
    }
    if (!scmDetail.scm_order?.receival_time) {
      console.log('receive time null');
      continue;
    }

    await database.imProcurementProd.supplier_orders.update({
      where: {
        id: missingObj.reference_order_id,
      },
      data: {
        receive_time: scmDetail.scm_order.receival_time,
      },
    });
    await database.scmOrderProd.procurement_orders.update({
      where: {
        client_order_id: missingObj.reference_order_id,
      },
      data: {
        customer_receive_time: scmDetail.scm_order.receival_time,
      },
    });
  }
};

run();
