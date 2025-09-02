import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const pOrders = await database.imProcurementProd.supplier_orders.findMany({
    orderBy: {
      created_at: 'desc',
    },
  });

  console.log(pOrders.length);

  for (const pOrder of pOrders) {
    const sOrder = await database.scmOrderProd.procurement_orders.findFirst({
      where: {
        client_order_id: pOrder.id,
      },
    });

    if (!sOrder) {
      console.log(`Supplier order ${pOrder.id} not found`);
      continue;
    }

    if (pOrder.status === 5 || pOrder.status === 4) {
      if (pOrder.status !== sOrder.status) {
        console.log(
          pOrder.id,
          'status mismatch',
          'p status',
          pOrder.status,
          's status',
          sOrder.status
        );
      }
    }
  }
};

run();
