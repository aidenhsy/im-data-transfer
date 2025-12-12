import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const count = await database.imInventoryProd.inventory_count.findMany({
    where: {
      shop_id: 139,
    },
    take: 2,
    orderBy: {
      created_at: 'desc',
    },
    include: {
      inventory_count_details: true,
    },
  });

  const beginningInventory = count[1].inventory_count_details.filter(
    (detail) => detail.count_qty && Number(detail.count_qty) > 0
  );
  const endingInventory = count[0].inventory_count_details;

  const uniqueSupplierItemIds = [
    ...new Set(beginningInventory.map((detail) => detail.supplier_item_id)),
  ];

  const inStock =
    await database.imProcurementProd.supplier_order_details.findMany({
      where: {
        supplier_orders: {
          shop_id: 139,
          status: 4,
          receive_time: {
            gt: count[1].created_at,
            lt: count[0].created_at,
          },
        },
      },
    });

  const uniqueInSupplierItemIds = [
    ...new Set(inStock.map((detail) => detail.supplier_item_id)),
  ];

  const allUniqueSupplierItemIds = [
    ...new Set([...uniqueSupplierItemIds, ...uniqueInSupplierItemIds]),
  ];

  console.log(endingInventory.length);
  console.log(
    'Total unique supplier item IDs:',
    allUniqueSupplierItemIds.length
  );
};

// run();

const run2 = async () => {
  const database = new DatabaseService();

  const inventoryCounts =
    await database.imInventoryProd.inventory_count.findMany({
      where: {
        shop_id: 139,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 2,
    });

  console.log('beginning inventory', inventoryCounts[1].created_at);
  console.log('ending inventory', inventoryCounts[0].created_at);

  const inOrders = await database.imProcurementProd.supplier_orders.findMany({
    where: {
      shop_id: 139,
      status: 4,
      receive_time: {
        gt: inventoryCounts[1].created_at,
        lt: inventoryCounts[0].created_at,
      },
    },
    include: {
      supplier_order_details: true,
    },
  });

  for (const order of inOrders) {
    console.log(
      'order',
      order.id,
      'detail length',
      order.supplier_order_details.length
    );
    for (const detail of order.supplier_order_details) {
      const inShopItem =
        await database.imInventoryProd.shop_item_weighted_price.findFirst({
          where: {
            shop_id: 139,
            source_detail_id: detail.id,
            type: 'order_in',
          },
        });

      if (!inShopItem) {
        console.log('inShopItem not found', detail);
      }
    }
  }
};

run2();
