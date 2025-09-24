import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const imReturns =
    await database.imProcurementProd.supplier_order_returns.findMany({
      where: {
        status: 1,
      },
    });

  const scmReturns =
    await database.scmOrderProd.procurement_order_returns.findMany({
      where: {
        status: 1,
      },
    });

  const missingScmReturns = imReturns.filter(
    (imReturn) =>
      !scmReturns.some(
        (scmReturn) => scmReturn.client_return_id === imReturn.id
      )
  );
  const missingImReturns = scmReturns.filter(
    (scmReturn) =>
      !imReturns.some((imReturn) => imReturn.id === scmReturn.client_return_id)
  );

  console.log(missingScmReturns);
  console.log(missingImReturns);
};

run();
