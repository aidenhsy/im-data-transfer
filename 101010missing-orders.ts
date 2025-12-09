import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const scmOrders = await database.scmOrderProd.procurement_orders.findMany({
    where: {
      shop_id: {
        notIn: [148],
      },
    },
  });

  const procurementOrders =
    await database.imProcurementProd.supplier_orders.findMany({
      where: {
        shop_id: {
          notIn: [148],
        },
      },
    });

  const missingScmOrders = procurementOrders.filter(
    (procurementOrder) =>
      !scmOrders.some(
        (scmOrder) => scmOrder.client_order_id === procurementOrder.id
      )
  );

  const missingProcurementOrders = scmOrders.filter(
    (scmOrder) =>
      !procurementOrders.some(
        (procurementOrder) => procurementOrder.id === scmOrder.client_order_id
      )
  );

  if (missingProcurementOrders.length > 0) {
    console.log(missingProcurementOrders.map((order) => order.client_order_id));
  }

  if (missingScmOrders.length > 0) {
    console.log(missingScmOrders.map((order) => order.id));
  }

  await database.disconnect();
  process.exit(0);
};

run();
