import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();
  const BATCH_SIZE = 1000;

  let skip = 0;

  while (true) {
    const details =
      await database.imProcurementProd.supplier_order_details.findMany({
        where: {
          supplier_orders: {
            status: {
              in: [4, 5],
            },
            receive_time: {
              // gte: new Date('2025-07-01T00:00:00.000Z'),
              // lte: new Date('2025-07-31T23:59:59.999Z'),
            },
          },
        },
        take: BATCH_SIZE,
        skip: skip,
        include: {
          supplier_order_return_details: {
            where: {
              supplier_order_returns: {
                status: 1,
              },
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
      });

    if (details.length === 0) {
      break;
    }
    skip += BATCH_SIZE;

    for (const detail of details) {
      const correctFinal =
        Number(detail.actual_delivery_qty) -
        Number(detail.supplier_order_return_details?.qty_returned ?? 0);

      const finalQty = Number(detail.final_qty);

      if (correctFinal.toFixed(2) !== finalQty.toFixed(2)) {
        console.log(`'${detail.id}',`);
      }
    }
  }
};

run();
