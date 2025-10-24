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

// run();

const runDetail = async () => {
  const database = new DatabaseService();

  const details =
    await database.imProcurementProd.supplier_order_details.findMany({
      where: {
        supplier_orders: {
          status: 4,
          receive_time: {
            gte: new Date('2025-10-01T00:00:00.000Z'),
          },
        },
      },
      select: {
        id: true,
        total_delivery_amount: true,
      },
    });

  console.log('details', details.length);

  const ledgers = await database.imAccountingProd.inventory_ledger.findMany({
    where: {
      created_at: {
        gte: new Date('2025-10-01T00:00:00.000Z'),
      },
    },
    select: {
      id: true,
      source_detail_id: true,
      total_value: true,
    },
  });

  console.log('ledgers', ledgers.length);

  for (const detail of details) {
    const ledger = ledgers.find(
      (ledger) => ledger.source_detail_id === detail.id
    );
    const diff = Math.abs(
      Number(detail.total_delivery_amount) - Number(ledger?.total_value)
    );
    if (diff > 1) {
      console.log(detail.id, diff);
    }
  }
};

runDetail();
