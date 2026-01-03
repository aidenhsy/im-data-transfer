import { getCurrentChinaTime } from '@saihu/common/dist/util/times';
import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const shops = await database.imBasicProd.scm_shop.findMany({
    where: {
      is_join: 0,
      status: 1,
    },
  });

  for (const shop of shops) {
    const runningRows = await database.imInventoryProd.$queryRaw<any[]>`
    SELECT DISTINCT ON (r.supplier_item_id)
           r.supplier_item_id,
           r.running_avg_cost_base AS weighted_price,
           r.running_qty_base      AS on_hand_base,
           r.generic_item_id       AS generic_item_id,
           r.stock_category_id     AS stock_category_id
    FROM v_shop_item_running r
    WHERE r.shop_id = ${Number(shop.id)}
      AND r.created_at <= ${getCurrentChinaTime()}
    ORDER BY r.supplier_item_id, r.created_at DESC, r.id DESC
  `;

    const badRecords = runningRows.filter(
      (r) => Number(r.on_hand_base ?? 0) < 0
    );
    console.log(
      shop.id,
      badRecords.map((r) => ({
        supplier_item_id: r.supplier_item_id,
        on_hand_base: r.on_hand_base,
      }))
    );
  }
};

run();
