import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.scmProd.scm_order.findMany({
    where: {
      delivery_day_info_id: '2025-12-23',
      order_type: 1,
    },
    include: {
      scm_order_details: {
        include: {
          scm_order_stock: true,
        },
      },
    },
  });

  for (const order of orders) {
    console.log(order.id);
    const caishiItems = order.scm_order_details.filter(
      (detail) =>
        detail.scm_order_stock?.stock_id === 6 ||
        detail.scm_order_stock?.stock_id === 10
    );
    const caishiPicking =
      await database.scmProd.scm_store_picking_supplyitems.findMany({
        where: {
          order_details_id: { in: caishiItems.map((item) => item.id) },
        },
      });
    console.log(caishiItems.length);
    console.log(caishiPicking.length);
    console.log('--------------------');

    if (caishiItems.length > caishiPicking.length) {
      for (const item of caishiItems) {
        await database.scmProd.scm_store_picking_supplyitems.create({
          data: {
            order_details_id: item.id,
            date: '2025-12-21T23:00:00Z',
            quantity_needed: item.num,
            quantity_picked: 0,
            created_at: '2025-12-21T23:00:00Z',
            stock_id: item.scm_order_stock?.stock_id,
            no_deliver: 0,
            status: 0,
            automatic: 1,
            estimated_delivery_date: '2025-12-23T08:00:00Z',
          },
        });
      }
    }
  }
};

run();
