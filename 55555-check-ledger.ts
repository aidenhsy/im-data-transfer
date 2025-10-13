import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const ledger = await database.imAccountingProd.inventory_ledger_bill.findMany(
    {
      where: {
        created_at: {
          gte: new Date('2025-10-01T00:00:00.000Z'),
        },
        biz_type_id: 1,
      },
      select: {
        id: true,
        source_id: true,
      },
    }
  );

  const procurementBills =
    await database.imProcurementProd.supplier_orders.findMany({
      select: {
        id: true,
      },
      where: {
        status: 4,
        receive_time: {
          gte: new Date('2025-10-01T00:00:00.000Z'),
        },
      },
    });

  console.log(ledger.length);
  console.log(procurementBills.length);

  const missingLedger = procurementBills.filter(
    (bill) => !ledger.some((ledger) => ledger.source_id === bill.id)
  );

  if (missingLedger.length > 0) {
    console.log('missingLedger');
    console.log(missingLedger.map((bill) => bill.id));
  }

  const missingBillIds = ledger.filter(
    (ledger) => !procurementBills.some((bill) => bill.id === ledger.source_id)
  );
  if (missingBillIds.length > 0) {
    console.log('missingBillIds');
    console.log(missingBillIds.map((bill) => bill.source_id));
  }

  // if (missingBillIds.length > 0) {
  //   console.log('missingBillIds');
  //   console.log(missingBillIds.map((bill) => bill.source_id));
  //   for (const bill of missingBillIds) {
  //     const procurementBill =
  //       await database.imProcurementProd.supplier_orders.findFirst({
  //         where: {
  //           id: bill.source_id,
  //         },
  //       });
  //     await database.imAccountingProd.inventory_ledger_bill.update({
  //       where: {
  //         id: bill.id,
  //       },
  //       data: {
  //         created_at: procurementBill?.receive_time!,
  //       },
  //     });
  //     await database.imAccountingProd.inventory_ledger.updateMany({
  //       where: {
  //         bill_id: bill.id,
  //       },
  //       data: {
  //         created_at: procurementBill?.receive_time!,
  //       },
  //     });
  //   }
  // }
};

run();
