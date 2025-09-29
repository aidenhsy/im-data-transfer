import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const bills = await database.imAccountingProd.inventory_ledger.findMany({
    distinct: ['biz_type_id', 'source_id'],
    select: {
      biz_type_id: true,
      source_id: true,
      shop_id: true,
      brand_id: true,
      org_id: true,
    },
  });

  console.log(bills.length);

  for (const bill of bills) {
    const newBill =
      await database.imAccountingProd.inventory_ledger_bill.upsert({
        where: {
          biz_type_id_source_id: {
            biz_type_id: bill.biz_type_id,
            source_id: bill.source_id,
          },
        },
        create: {
          biz_type_bill_id: bill.biz_type_id,
          biz_type_id: bill.biz_type_id,
          source_id: bill.source_id,
          shop_id: bill.shop_id,
          brand_id: bill.brand_id,
          org_id: bill.org_id,
        },
        update: {},
      });

    await database.imAccountingProd.inventory_ledger.updateMany({
      where: {
        AND: [
          {
            biz_type_id: bill.biz_type_id,
          },
          {
            source_id: bill.source_id,
          },
        ],
      },
      data: {
        bill_id: newBill.id,
      },
    });
  }
};

run();
