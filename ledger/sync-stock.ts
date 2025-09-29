import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const ledgers = await database.imAccountingProd.inventory_ledger.findMany({
    where: {
      stock_id: null,
    },
    select: {
      id: true,
      biz_type_id: true,
      source_detail_id: true,
    },
  });

  for (const ledger of ledgers) {
    if (ledger.biz_type_id === 1) {
      const detail =
        await database.imProcurementProd.supplier_order_details.findUnique({
          where: {
            id: ledger.source_detail_id,
          },
          select: {
            stock_category_id: true,
          },
        });
      await database.imAccountingProd.inventory_ledger.update({
        where: {
          id: ledger.id,
        },
        data: {
          stock_id: detail?.stock_category_id,
        },
      });
    }
    if (ledger.biz_type_id === 2) {
      const detail =
        await database.imProcurementProd.supplier_order_return_details.findUnique(
          {
            where: {
              id: ledger.source_detail_id,
            },
            select: {
              supplier_order_details: {
                select: {
                  stock_category_id: true,
                },
              },
            },
          }
        );
      await database.imAccountingProd.inventory_ledger.update({
        where: {
          id: ledger.id,
        },
        data: {
          stock_id: detail?.supplier_order_details.stock_category_id,
        },
      });
    }
  }
};

run();
