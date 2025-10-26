import { DatabaseService } from './database';

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

// runDetail();

const runReturn = async () => {
  const database = new DatabaseService();

  const returns =
    await database.imProcurementProd.supplier_order_returns.findMany({
      where: {
        status: 1,
        supplier_orders: {
          receive_time: {
            gte: new Date('2025-10-01T00:00:00.000Z'),
          },
        },
      },
      include: {
        supplier_order_return_details: true,
        supplier_orders: true,
      },
    });

  const returnBills =
    await database.imAccountingProd.inventory_ledger_bill.findMany({
      where: {
        biz_type_id: 2,
        created_at: {
          gte: new Date('2025-10-01T00:00:00.000Z'),
        },
      },
    });

  console.log('returnDetails', returns.length);
  console.log('returnBills', returnBills.length);

  if (returnBills.length < returns.length) {
    console.log('returnBills < returns');
    const missingReturnIds = returns
      .filter(
        (returnItem) =>
          !returnBills.some((bill) => bill.source_id === returnItem.id)
      )
      .map((returnItem) => returnItem.id);

    for (const returnId of missingReturnIds) {
      const returnItem = returns.find(
        (returnItem) => returnItem.id === returnId
      );

      if (!returnItem) {
        continue;
      }

      console.log(returnItem.id);
    }
  }
};

runReturn();
