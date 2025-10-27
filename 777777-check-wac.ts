import { DatabaseService } from './database';

const run = async () => {
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

  const wacs = await database.imInventoryProd.shop_item_weighted_price.findMany(
    {
      where: {
        type: 'order_in',
        created_at: {
          gte: new Date('2025-10-01T00:00:00.000Z'),
        },
      },
      select: {
        source_detail_id: true,
      },
    }
  );

  console.log('details', details.length);
  console.log('wacs', wacs.length);

  if (details.length !== wacs.length) {
    console.log('details.length !== wacs.length');
    const missingDetails = details.filter(
      (detail) => !wacs.some((wac) => wac.source_detail_id === detail.id)
    );
    console.log('missingDetails', missingDetails.length);
    for (const detail of missingDetails) {
      console.log(`'${detail.id}',`);
    }
  }
};

run();
