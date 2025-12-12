import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const scmReturns =
    await database.scmOrderProd.procurement_order_returns.findMany({
      where: {
        shop_id: {
          notIn: [148],
        },
      },
      select: {
        client_return_id: true,
      },
    });

  const imReturns =
    await database.imProcurementProd.supplier_order_returns.findMany();

  console.log(scmReturns.length);
  console.log(imReturns.length);
};

run();
