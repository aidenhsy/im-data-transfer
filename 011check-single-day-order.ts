import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.imProcurementProd.supplier_orders.findMany({
    where: {
      created_at: {
        gte: new Date('2025-12-06 00:00:00'),
      },
      type: 3,
    },
    select: {
      id: true,
      supplier_order_details: {
        select: {
          order_id: true,
          supplier_reference_id: true,
        },
      },
    },
  });

  for (const order of orders) {
    console.log(`updating order: ${order.id}`);
    const scmDetails = await database.scmProd.scm_order_details.findMany({
      where: {
        reference_order_id: order.id,
      },
    });

    for (const detail of scmDetails) {
      const scmDetail = scmDetails.find(
        (d) => d.reference_id === detail.reference_id
      );
      if (!scmDetail) {
        console.log('not found', detail.reference_id);
        continue;
      }

      await database.scmProd.scm_order_details.update({
        where: {
          id: scmDetail.id,
        },
        data: {
          deliver_goods_qty: detail.num,
          delivery_qty: detail.num,
        },
      });
    }
  }
  console.log('done');
  process.exit(0);
};

run();
