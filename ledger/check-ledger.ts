import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const ledger = await database.imAccountingProd.inventory_ledger.findMany({
    where: {
      created_at: {
        gte: new Date('2025-09-01T00:00:00.000Z'),
      },
    },
  });

  for (const item of ledger) {
    if (item.biz_type_id === 1) {
      const detail =
        await database.imProcurementProd.supplier_order_details.findUnique({
          where: {
            id: item.source_detail_id,
          },
        });
      if (!detail) {
        console.log('biz type 1', item.source_detail_id, 'no detail');
        continue;
      }
      if (Number(detail.total_final_amount) !== Number(item.total_value)) {
        console.log(
          'biz type 1',
          item.source_detail_id,
          'total_final_amount mismatch'
        );
      }
    }

    if (item.biz_type_id === 2) {
      const detail =
        await database.imProcurementProd.supplier_order_return_details.findUnique(
          {
            where: {
              id: item.source_detail_id,
            },
          }
        );
      if (!detail) {
        console.log('biz type 2', item.source_detail_id, 'no detail');
        continue;
      }
      if (Number(detail.total_value) !== -Number(item.total_value)) {
        console.log(
          'biz type 2',
          item.source_detail_id,
          'return total_value mismatch'
        );
      }
    }
  }
};

run();
