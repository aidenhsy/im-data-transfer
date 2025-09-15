import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const returns =
    await database.imProcurementProd.supplier_order_returns.findMany();

  for (const returnData of returns) {
    const scmReturn =
      await database.scmOrderProd.procurement_order_returns.findFirst({
        where: {
          client_return_id: returnData.id,
        },
      });
    if (!scmReturn) {
      console.log('scmReturn not found', returnData.id);
      continue;
    }
    await database.scmOrderProd.procurement_order_returns.update({
      where: { id: scmReturn.id },
      data: {
        return_reason_id: returnData.return_reason_id,
      },
    });
  }
};

run();
