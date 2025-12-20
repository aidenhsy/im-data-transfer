import { DatabaseService } from './database';

const orderIn = async () => {
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
        total_value: true,
      },
    }
  );

  console.log('details', details.length);
  console.log('wacs', wacs.length);

  if (details.length > wacs.length) {
    console.log('details.length > wacs.length');
    const missingDetails = details.filter(
      (detail) => !wacs.some((wac) => wac.source_detail_id === detail.id)
    );
    console.log('missingDetails', missingDetails.length);
    for (const detail of missingDetails) {
      const detailItem =
        await database.imProcurementProd.supplier_order_details.findUnique({
          where: {
            id: detail.id,
          },
          include: {
            supplier_orders: true,
          },
        });
      if (!detailItem) {
        continue;
      }

      await database.imInventoryProd.shop_item_weighted_price.create({
        data: {
          shop_id: detailItem.supplier_orders.shop_id,
          supplier_item_id: detailItem.supplier_item_id!,
          total_qty: detailItem.actual_delivery_qty,
          total_value: detailItem.total_delivery_amount,
          source_id: detailItem.supplier_orders.id,
          source_detail_id: detailItem.id,
          type: 'order_in',
          created_at: detailItem.supplier_orders.receive_time!,
          updated_at: detailItem.supplier_orders.receive_time!,
          status: 1,
          order_to_base_factor: detailItem.package_unit_to_base_ratio,
          generic_item_id: detailItem.item_id,
          stock_category_id: detailItem.stock_category_id,
        },
      });
      console.log(`created wac for detail ${detail.id}`);
    }
  }

  if (details.length === wacs.length) {
    console.log('details.length === wacs.length');
    for (const detail of details) {
      const wac = wacs.find((wac) => wac.source_detail_id === detail.id);
      if (!wac) {
        continue;
      }
      const diff = Math.abs(
        Number(detail.total_delivery_amount) - Number(wac.total_value)
      );
      if (diff > 1) {
        console.log(`'${detail.id}',`);
      }
    }
  }
};
orderIn();
