import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();
  const scmReturns =
    await database.scmOrderLocal.procurement_order_returns.findMany({
      where: {
        status: 1,
      },
    });

  for (const scmReturn of scmReturns) {
    const imReturn =
      await database.imProcurementLocal.supplier_order_returns.findFirst({
        where: {
          id: scmReturn.client_return_id!,
          status: 1,
        },
      });

    if (!imReturn) {
      console.log('imReturn not found', scmReturn.client_return_id);
      continue;
    }
  }
};

run();
