import { DatabaseService } from '../database';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Repair script: fix inventory_count_details rows where balance_qty IS NULL
 * (non-locked, submitted full counts only).
 *
 * Root cause: when a count was created the v_shop_item_running snapshot was
 * either missing or not recorded, leaving balance_qty=null.  The computed
 * column delta_qty then evaluates as count_qty_base - 0, inflating the WAC
 * delta and corrupting every subsequent balance snapshot.
 *
 * Fix per affected row:
 *   1. Re-derive the correct balance by querying v_shop_item_running at
 *      strictly BEFORE the count's created_at (so the count's own WAC entry,
 *      which shares the same created_at, is excluded).
 *   2. Write balance_qty = correct_balance into inventory_count_details.
 *   3. Fix the corresponding shop_item_weighted_price row so that
 *      total_qty = count_qty_base - correct_balance  (order_to_base_factor=1
 *      for stock_count entries, so total_qty == total_qty_base).
 *
 * Run in DRY_RUN=true mode first to preview changes before applying.
 */

const DRY_RUN = process.env.DRY_RUN !== 'false';

interface RunningRow {
  supplier_item_id: string;
  running_qty_base: Decimal | null;
}

const run = async () => {
  const db = new DatabaseService();

  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE – writing changes'}\n`);

  // All submitted, non-locked details that are missing balance_qty and have
  // an actual count recorded.
  const affected = await db.imInventoryProd.inventory_count_details.findMany({
    where: {
      balance_qty: null,
      is_locked: false,
      count_qty: { not: null },
      inventory_count: { status: 1 },
    },
    select: {
      id: true,
      shop_id: true,
      supplier_item_id: true,
      count_qty_base: true,
      inventory_count: {
        select: {
          id: true,
          created_at: true,
        },
      },
    },
    orderBy: { created_at: 'asc' },
  });

  console.log(`Found ${affected.length} detail row(s) to repair.\n`);

  let fixed = 0;
  let skipped = 0;

  for (const detail of affected) {
    const count = detail.inventory_count;
    const shopId = Number(detail.shop_id);
    const countQtyBase = new Decimal(detail.count_qty_base ?? 0);

    // Query the running balance just BEFORE this count's created_at.
    // Using strict < excludes the count's own WAC entry (written with
    // created_at = count.created_at) so we get the true prior balance.
    const [running] = await db.imInventoryProd.$queryRaw<RunningRow[]>`
      SELECT DISTINCT ON (r.supplier_item_id)
        r.supplier_item_id,
        r.running_qty_base
      FROM v_shop_item_running r
      WHERE r.shop_id    = ${shopId}
        AND r.supplier_item_id = ${detail.supplier_item_id}
        AND r.created_at  < ${count.created_at}
      ORDER BY r.supplier_item_id, r.created_at DESC, r.id DESC
    `;

    const correctBalance = new Decimal(running?.running_qty_base ?? 0);
    const correctDelta   = countQtyBase.minus(correctBalance);

    console.log(
      `detail=${detail.id}  count=${count.id}  shop=${shopId}\n` +
      `  supplier_item=${detail.supplier_item_id}\n` +
      `  correct balance_qty : ${correctBalance.toFixed(4)}\n` +
      `  correct WAC delta   : ${correctDelta.toFixed(4)}  (was ${countQtyBase.toFixed(4)})\n`,
    );

    if (DRY_RUN) {
      skipped++;
      continue;
    }

    // 1. Patch balance_qty on the detail row.
    await db.imInventoryProd.inventory_count_details.update({
      where: { id: detail.id },
      data: { balance_qty: correctBalance },
    });

    // 2. Patch total_qty on the WAC entry so the stock ledger is consistent.
    //    order_to_base_factor is always 1 for stock_count rows, so
    //    total_qty = total_qty_base = delta in base units.
    const wacUpdated = await db.imInventoryProd.shop_item_weighted_price.updateMany({
      where: {
        source_detail_id: detail.id,
        type: 'stock_count',
      },
      data: { total_qty: correctDelta },
    });

    if (wacUpdated.count === 0) {
      console.warn(`  ⚠ No WAC entry found for detail ${detail.id} – balance_qty patched but WAC unchanged.`);
    }

    fixed++;
    console.log(`  ✓ Updated\n`);
  }

  console.log(`\nDone. Fixed=${fixed}  Skipped(dry-run)=${skipped}`);
  process.exit(0);
};

run();
