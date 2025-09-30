import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const bills = await database.imAccountingProd.inventory_ledger_bill.findMany({
    select: {
      id: true,
    },
  });
  console.log(bills.length);

  for (const bill of bills) {
    const ledger = await database.imAccountingProd.inventory_ledger.findFirst({
      where: {
        bill_id: bill.id,
      },
      select: {
        created_at: true,
        updated_at: true,
      },
    });

    await database.imAccountingProd.inventory_ledger_bill.update({
      where: {
        id: bill.id,
      },
      data: {
        created_at: ledger?.created_at,
        updated_at: ledger?.updated_at,
      },
    });
  }
  console.log('done');
  process.exit(0);
};

run();
