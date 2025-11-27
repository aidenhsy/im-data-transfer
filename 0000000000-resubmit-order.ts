import axios from 'axios';
import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.imProcurementProd.supplier_orders.findMany({
    where: {
      status: 50,
      type: 9,
      created_at: {
        gte: new Date('2025-11-12 00:00:00'),
      },
    },
    select: {
      id: true,
    },
  });
  console.log(orders.length);
  for (const order of orders) {
    await axios.post(
      `https://imms.shaihukeji.com/procurement/orders/resubmit`,
      {
        order_id: order.id,
      }
    );
  }
};

run();
