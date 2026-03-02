import { DatabaseService } from '../database';
import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'crypto';

/**
 * Repair script: eliminate all negative current_qty_base in v_shop_item_current.
 *
 * Phase 1: Fix count chains — balance_qty of count N = count_qty_base of count N-1.
 * Phase 2: For any items still negative after chain fix, insert an adjustment
 *          entry in shop_item_weighted_price to bring the balance to zero.
 *
 * Run with DRY_RUN=true (default) to preview, DRY_RUN=false to apply.
 */

const DRY_RUN = process.env.DRY_RUN !== 'false';

interface NegativeItem {
  supplier_item_id: string;
  shop_id: number;
  current_qty_base: Decimal;
}

interface WacRef {
  generic_item_id: number | null;
  stock_category_id: number | null;
}

const run = async () => {
  const db = new DatabaseService();

  console.log(
    `Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE – writing changes'}\n`,
  );

  // ════════════════════════════════════════════════════════════════════════
  // Phase 1: Fix count chains
  // ════════════════════════════════════════════════════════════════════════
  console.log('═══ Phase 1: Fix count chains ═══\n');

  const negativeItems = await db.imInventoryProd.$queryRaw<NegativeItem[]>`
    SELECT supplier_item_id, shop_id, current_qty_base
    FROM v_shop_item_current
    WHERE current_qty_base < 0
  `;

  console.log(
    `Found ${negativeItems.length} item(s) with negative current_qty_base.\n`,
  );

  let chainFixes = 0;

  for (const item of negativeItems) {
    console.log(
      `\n--- supplier_item=${item.supplier_item_id}  shop=${item.shop_id}  current_qty=${item.current_qty_base} ---`,
    );

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

          chainFixes++;
        }
      }

      if (detail.count_qty !== null) {
        prevCountQtyBase = detail.count_qty_base;
      }
    }
  }

  console.log(`\nPhase 1 done. Chain fixes: ${chainFixes}\n`);

  // ════════════════════════════════════════════════════════════════════════
  // Phase 2: Zero out remaining negative balances with adjustment entries
  // ════════════════════════════════════════════════════════════════════════
  console.log('═══ Phase 2: Insert adjustments for remaining negative items ═══\n');

  const stillNegative = await db.imInventoryProd.$queryRaw<NegativeItem[]>`
    SELECT supplier_item_id, shop_id, current_qty_base
    FROM v_shop_item_current
    WHERE current_qty_base < 0
  `;

  console.log(
    `${stillNegative.length} item(s) still negative after chain fix.\n`,
  );

  let adjustments = 0;

  for (const item of stillNegative) {
    const correctionQty = new Decimal(item.current_qty_base).abs();

    // Get generic_item_id and stock_category_id from the latest WAC entry
    const ref = await db.imInventoryProd.$queryRaw<WacRef[]>`
      SELECT generic_item_id, stock_category_id
      FROM shop_item_weighted_price
      WHERE supplier_item_id = ${item.supplier_item_id}
        AND shop_id = ${item.shop_id}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const genericItemId = ref[0]?.generic_item_id ?? null;
    const stockCategoryId = ref[0]?.stock_category_id ?? null;
    const sourceDetailId = randomUUID();

    console.log(
      `  supplier_item=${item.supplier_item_id}  shop=${item.shop_id}\n` +
        `    current_qty : ${item.current_qty_base}\n` +
        `    adjustment  : +${correctionQty}  (to bring to 0)\n` +
        `    source_detail_id: ${sourceDetailId}`,
    );

    if (!DRY_RUN) {
      await db.imInventoryProd.$executeRaw`
        INSERT INTO shop_item_weighted_price (
          shop_id, supplier_item_id,
          total_qty, total_value,
          type, order_to_base_factor,
          source_id, source_detail_id,
          generic_item_id, stock_category_id, status
        ) VALUES (
          ${item.shop_id}, ${item.supplier_item_id},
          ${correctionQty}, 0,
          'adjustment'::shop_item_price_event_type, 1,
          'negative-balance-fix', ${sourceDetailId}::varchar,
          ${genericItemId}, ${stockCategoryId}, 1
        )
      `;
      console.log(`    ✓ Adjustment inserted`);
    }

    adjustments++;
  }

  console.log(
    `\nPhase 2 done. Adjustments: ${adjustments}\n`,
  );

  // ════════════════════════════════════════════════════════════════════════
  // Final verification
  // ════════════════════════════════════════════════════════════════════════
  const finalCheck = await db.imInventoryProd.$queryRaw<[{ count: bigint }]>`
    SELECT count(*) FROM v_shop_item_current WHERE current_qty_base < 0
  `;

  console.log(
    `\n═══ Summary ═══\n` +
      `  Phase 1 chain fixes : ${chainFixes}\n` +
      `  Phase 2 adjustments : ${adjustments}\n` +
      `  Remaining negative  : ${finalCheck[0].count}\n`,
  );

  process.exit(0);
};

run();
