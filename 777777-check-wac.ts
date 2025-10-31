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

const orderReturn = async () => {
  const database = new DatabaseService();

  const returnDetails =
    await database.imProcurementProd.supplier_order_return_details.findMany({
      where: {
        status: 1,
        supplier_order_returns: {
          supplier_orders: {
            receive_time: {
              gte: new Date('2025-10-01T00:00:00.000Z'),
            },
          },
        },
      },
      select: {
        id: true,
        source_detail_id: true,
        total_value: true,
      },
    });
  const wacs = await database.imInventoryProd.shop_item_weighted_price.findMany(
    {
      where: {
        type: 'order_return',
        created_at: {
          gte: new Date('2025-10-01T00:00:00.000Z'),
        },
      },
      select: {
        id: true,
        source_detail_id: true,
        total_value: true,
      },
    }
  );

  console.log('returnDetails', returnDetails.length);
  console.log('wacs', wacs.length);

  if (returnDetails.length > wacs.length) {
    console.log('returnDetails.length > wacs.length');
    const missingReturnDetails = returnDetails.filter(
      (returnDetail) =>
        !wacs.some((wac) => wac.source_detail_id === returnDetail.id)
    );
    for (const returnDetail of missingReturnDetails) {
      const returnDetailItem =
        await database.imProcurementProd.supplier_order_return_details.findUnique(
          {
            where: {
              id: returnDetail.id,
            },
            include: {
              supplier_order_returns: true,
              supplier_order_details: true,
            },
          }
        );
      if (!returnDetailItem) {
        continue;
      }
      await database.imInventoryProd.shop_item_weighted_price.create({
        data: {
          shop_id: returnDetailItem.supplier_order_returns.shop_id,
          supplier_item_id: returnDetailItem.supplier_item_id!,
          total_qty: -returnDetailItem.qty_returned,
          total_value: -Number(returnDetailItem.total_value!),
          source_id: returnDetailItem.return_id,
          source_detail_id: returnDetailItem.id,
          type: 'order_return',
          created_at: returnDetailItem.supplier_order_returns.created_at!,
          updated_at: returnDetailItem.supplier_order_returns.created_at!,
          status: 1,
          order_to_base_factor:
            returnDetailItem.supplier_order_details.package_unit_to_base_ratio!,
          generic_item_id: returnDetailItem.supplier_order_details.item_id,
          stock_category_id:
            returnDetailItem.supplier_order_details.stock_category_id,
        },
      });
      console.log(`created wac for returnDetail ${returnDetail.id}`);
    }
  }

  if (wacs.length > returnDetails.length) {
    console.log('wacs.length > returnDetails.length');
    const missingWacs = wacs.filter(
      (wac) =>
        !returnDetails.some(
          (returnDetail) => returnDetail.id === wac.source_detail_id
        )
    );
    console.log(
      'missingWacs',
      missingWacs.map((wac) => wac.source_detail_id)
    );
    await database.imInventoryProd.shop_item_weighted_price.deleteMany({
      where: {
        source_detail_id: {
          in: missingWacs
            .map((wac) => wac.source_detail_id)
            .filter((id): id is string => id !== null),
        },
      },
    });
  }

  if (wacs.length === returnDetails.length) {
    console.log('wacs.length === returnDetails.length');
    for (const wac of wacs) {
      const returnDetail = returnDetails.find(
        (returnDetail) => returnDetail.id === wac.source_detail_id
      );
      if (!returnDetail) {
        continue;
      }
      const diff = Math.abs(
        Math.abs(Number(returnDetail.total_value)) -
          Math.abs(Number(wac.total_value))
      );
      if (diff > 1) {
        console.log(wac.total_value, returnDetail.total_value);
      }
    }
  }
};

const main = async () => {
  const arg = process.argv[2]; // e.g. "run" or "return"
  if (arg === 'orderin') {
    await orderIn();
  } else if (arg === 'return') {
    await orderReturn();
  } else {
    console.error('Usage: ts-node script.ts [run|return]');
    process.exit(1);
  }
};

main();
