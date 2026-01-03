import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const imorders = await database.imProcurementProd.supplier_orders.findMany({
    where: {
      delivery_date: {
        gt: '2025-12-01T00:00:00Z',
        lt: '2026-01-01T00:00:00Z',
      },
      type: {
        in: [3, 9],
      },
      status: {
        not: 4,
      },
    },
  });
};

run();
