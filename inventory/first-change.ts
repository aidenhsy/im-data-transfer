import { DatabaseService } from '../database';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Repair script: fix inventory_count_details where balance_qty doesn't match
 * the previous count's count_qty_base for the same (supplier_item, shop).
 *
 * Rule: balance_qty of count N = count_qty_base of count N-1
 *
 * Uses LAG() window function to find all mismatches in one query, then patches
 * both inventory_count_details.balance_qty and shop_item_weighted_price.total_qty.
 *
 * Run with DRY_RUN=true (default) to preview, DRY_RUN=false to apply.
 */

const DRY_RUN = process.env.DRY_RUN !== 'false';

interface MismatchRow {
  id: string;
  supplier_item_id: string;
  shop_id: number;
  count_qty_base: Decimal;
  balance_qty: Decimal | null;
  prev_count_qty_base: Decimal;
  count_id: string;
  count_created_at: Date;
}

const run = async () => {
  const db = new DatabaseService();

  console.log(
    `Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE – writing changes'}\n`,
  );

  const mismatches = await db.imInventoryProd.$queryRaw<MismatchRow[]>`
    WITH counted AS (
      SELECT
        icd.id,
        icd.supplier_item_id,
        icd.shop_id,
        icd.count_qty_base,
        icd.balance_qty,
        icd.is_locked,
        ic.created_at AS count_created_at,
        ic.id         AS count_id
      FROM inventory_count_details icd
      JOIN inventory_count ic ON ic.id = icd.inventory_count_id
      WHERE ic.status = 1
        AND icd.count_qty IS NOT NULL
    ),
    chained AS (
      SELECT
        *,
        LAG(count_qty_base) OVER (
          PARTITION BY supplier_item_id, shop_id
          ORDER BY count_created_at, count_id
        ) AS prev_count_qty_base
      FROM counted
    )
    SELECT id, supplier_item_id, shop_id, count_qty_base, balance_qty,
           prev_count_qty_base, count_id, count_created_at
    FROM chained
    WHERE prev_count_qty_base IS NOT NULL
      AND is_locked = false
      AND (balance_qty IS DISTINCT FROM prev_count_qty_base)
    ORDER BY shop_id, supplier_item_id, count_created_at
  `;

  console.log(
    `Found ${mismatches.length} detail(s) where balance_qty != previous count's count_qty_base.\n`,
  );

  let fixed = 0;
  for (const row of mismatches) {
    const correctBalance = new Decimal(row.prev_count_qty_base);
    const countQtyBase = new Decimal(row.count_qty_base);
    const correctDelta = countQtyBase.minus(correctBalance);
    const oldDelta = countQtyBase.minus(new Decimal(row.balance_qty ?? 0));

    console.log(
      `detail=${row.id}  count=${row.count_id}  shop=${row.shop_id}\n` +
        `  supplier_item=${row.supplier_item_id}\n` +
        `  balance_qty : ${row.balance_qty} → ${correctBalance}\n` +
        `  WAC delta   : ${oldDelta} → ${correctDelta}`,
    );

    if (DRY_RUN) {
      console.log('');
      continue;
    }

    await db.imInventoryProd.inventory_count_details.update({
      where: { id: row.id },
      data: { balance_qty: correctBalance },
    });

    const wacUpdated =
      await db.imInventoryProd.shop_item_weighted_price.updateMany({
        where: {
          source_detail_id: row.id,
          type: 'stock_count',
        },
        data: { total_qty: correctDelta },
      });

    if (wacUpdated.count === 0) {
      console.warn(`  ⚠ No WAC entry for detail ${row.id}`);
    }

    fixed++;
    console.log(`  ✓ Updated\n`);
  }

  console.log(
    `\nDone. Fixed=${fixed}  Total mismatches=${mismatches.length}`,
  );
  process.exit(0);
};

run();
