import 'reflect-metadata';
import { getCurrentChinaTime } from '@saihu/common';
import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const shops = await database.imProcurementProd.scm_shop.findMany({
    where: {
      status: 1,
      is_join: 0,
    },
    select: {
      id: true,
      shop_name: true,
    },
    orderBy: {
      id: 'asc',
    },
  });

  for (const shop of shops) {
    const count = await database.imInventoryProd.$queryRaw<any[]>`
      SELECT DISTINCT ON (r.supplier_item_id)
               r.supplier_item_id,
               r.running_avg_cost_base AS weighted_price,
               r.running_qty_base      AS on_hand_base,
               r.generic_item_id       AS generic_item_id,
               r.stock_category_id     AS stock_category_id
        FROM v_shop_item_running r
        WHERE r.shop_id = ${Number(shop.id)}
          AND r.created_at <= ${getCurrentChinaTime()}
        ORDER BY r.supplier_item_id, r.created_at DESC, r.id DESC`;

    for (const item of count) {
      const procurements =
        await database.imProcurementProd.supplier_order_details.findMany({
          where: {
            supplier_item_id: item.supplier_item_id,
            supplier_orders: {
              status: 4,
              delivery_time: {
                gt: '2025-12-01T00:00:00Z',
                lt: '2025-12-31T23:59:59Z',
              },
            },
          },
        });

      console.log(
        item.supplier_item_id,
        item.weighted_price,
        item.on_hand_base,
        item.generic_item_id,
        item.stock_category_id
      );
    }

    console.log(shop.shop_name, count.length);
  }
};

run();
