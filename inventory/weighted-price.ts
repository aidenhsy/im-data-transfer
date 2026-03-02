import { DatabaseService } from '../database';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Repair script: fix negative current_qty_base in v_shop_item_current.
 *
 * For each (supplier_item, shop) with current_qty_base < 0:
 *   Walk the chain of submitted counts ordered by created_at.
 *   Rule: balance_qty of count N = count_qty_base of count N-1.
 *   Fix balance_qty on the detail, and total_qty + total_value on the WAC entry.
 *
 * Run with DRY_RUN=true (default) to preview, DRY_RUN=false to apply.
 */

const DRY_RUN = process.env.DRY_RUN !== 'false';

interface NegativeItem {
  supplier_item_id: string;
  shop_id: number;
  current_qty_base: Decimal;
}

const run = async () => {
  const db = new DatabaseService();

  console.log(
    `Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE – writing changes'}\n`,
  );

  // Step 1: Find all items with negative current stock
  const negativeItems = await db.imInventoryProd.$queryRaw<NegativeItem[]>`
    SELECT supplier_item_id, shop_id, current_qty_base
    FROM v_shop_item_current
    WHERE current_qty_base < 0
  `;

  console.log(
    `Found ${negativeItems.length} item(s) with negative current_qty_base.\n`,
  );

  let totalFixed = 0;

  for (const item of negativeItems) {
    console.log(
      `\n--- supplier_item=${item.supplier_item_id}  shop=${item.shop_id}  current_qty=${item.current_qty_base} ---`,
    );

    // Step 2: Get the full chain of submitted count details for this item
    const chain = await db.imInventoryProd.inventory_count_details.findMany({
      where: {
        supplier_item_id: item.supplier_item_id,
        shop_id: item.shop_id,
        inventory_count: { status: 1 },
      },
      select: {
        id: true,
        count_qty: true,
        count_qty_base: true,
        balance_qty: true,
        weighted_price: true,
        is_locked: true,
        inventory_count: {
          select: { id: true, created_at: true },
        },
      },
      orderBy: {
        inventory_count: { created_at: 'asc' },
      },
    });

    console.log(`  Chain length: ${chain.length} count details`);

    // Step 3: Walk the chain and fix mismatches
    let prevCountQtyBase: Decimal | null = null;

    for (const detail of chain) {
      if (prevCountQtyBase !== null && !detail.is_locked) {
        const currentBalance = detail.balance_qty;
        const correctBalance = prevCountQtyBase;
        const needsFix =
          currentBalance === null || !currentBalance.equals(correctBalance);

        if (needsFix) {
          const countQtyBase = new Decimal(detail.count_qty_base ?? 0);
          const correctDelta = countQtyBase.minus(correctBalance);
          const oldDelta = countQtyBase.minus(
            new Decimal(currentBalance ?? 0),
          );
          const hasCounted = detail.count_qty !== null;

          console.log(
            `  detail=${detail.id}  count=${detail.inventory_count.id}\n` +
              `    balance_qty : ${currentBalance} → ${correctBalance}\n` +
              (hasCounted
                ? `    WAC delta   : ${oldDelta} → ${correctDelta}`
                : `    (no WAC - count_qty is null)`),
          );

          if (!DRY_RUN) {
            await db.imInventoryProd.inventory_count_details.update({
              where: { id: detail.id },
              data: { balance_qty: correctBalance },
            });

            if (hasCounted) {
              const correctValue = correctDelta.mul(
                new Decimal(detail.weighted_price),
              );
              const wacUpdated =
                await db.imInventoryProd.shop_item_weighted_price.updateMany({
                  where: {
                    source_detail_id: detail.id,
                    type: 'stock_count',
                  },
                  data: {
                    total_qty: correctDelta,
                    total_value: correctValue,
                  },
                });

              if (wacUpdated.count === 0) {
                console.warn(`    ⚠ No WAC entry for detail ${detail.id}`);
              } else {
                console.log(`    ✓ Updated detail + WAC`);
              }
            } else {
              console.log(`    ✓ Updated detail only`);
            }
          }

          totalFixed++;
        }
      }

      // Advance chain: only actually-counted details set the "previous" reference
      if (detail.count_qty !== null) {
        prevCountQtyBase = detail.count_qty_base;
      }
    }
  }

  console.log(
    `\nDone. Total details fixed: ${totalFixed}  Negative items processed: ${negativeItems.length}`,
  );
  process.exit(0);
};

run();
