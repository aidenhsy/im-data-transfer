import { DatabaseService } from './database';
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

const TY_STORAGE = ['01', '02', '07']; // 铁越仓库编码

const run = async () => {
  const database = new DatabaseService();

  const bulkPickings = await database.scmProd.scm_bulk_picking.findMany({
    where: {
      estimated_delivery_date: new Date('2026-01-12'),
      automatic: 1,
    },
  });
  console.log('Total bulk pickings:', bulkPickings.length);

  let missingCount = 0;
  let createdCount = 0;

  for (const bulkPicking of bulkPickings) {
    const existingRoutes =
      await database.scmProd.scm_bulk_picking_routes.findMany({
        where: {
          bulk_picking_id: bulkPicking.id,
        },
      });

    if (existingRoutes.length === 0) {
      missingCount++;
      console.log(
        `Missing routes for bulk_picking_id: ${bulkPicking.id}, goods_id: ${bulkPicking.goods_id}`
      );

      // Find storage positions for this goods - FIXED SQL
      const storagePositions = await database.scmProd.$queryRaw<
        Array<{
          storage_position_id: string;
          qty: Decimal;
          row_num: number;
          column_num: number;
          level_num: number;
        }>
      >(Prisma.sql`
        SELECT 
          sp.storage_position_id,
          sp.qty,
          p.row_num,
          p.column_num,
          p.level_num
        FROM scm_storage_position_scm_goods sp
        JOIN scm_storage_position p ON sp.storage_position_id = p.id
        WHERE sp.good_id = ${bulkPicking.goods_id}
          AND p.small_storage_id IN ('01', '02', '07')
          AND sp.qty > 0
        ORDER BY 
          p.level_num, 
          p.row_num,
          CASE 
            WHEN MOD(p.row_num, 2) = 1 THEN p.column_num 
            ELSE -p.column_num 
          END
      `);

      if (storagePositions.length === 0) {
        console.log(
          `  No storage positions found for goods_id: ${bulkPicking.goods_id}`
        );
        continue;
      }

      // Create picking routes until quantity_needed is fulfilled
      let quantityNeeded = new Decimal(bulkPicking.quantity_needed || 0);

      for (const position of storagePositions) {
        if (quantityNeeded.lte(0)) {
          break;
        }

        const positionQty = new Decimal(position.qty);
        const quantityToPick = quantityNeeded.lt(positionQty)
          ? quantityNeeded
          : positionQty;

        if (quantityToPick.gt(0) && positionQty.gt(0)) {
          await database.scmProd.scm_bulk_picking_routes.create({
            data: {
              id: uuidv4(),
              bulk_picking_id: bulkPicking.id,
              date: new Date(),
              good_id: bulkPicking.goods_id,
              storage_position_id: position.storage_position_id,
              storage_position_qty: positionQty,
              quantity_needed: quantityToPick,
              quantity_picked: new Decimal(0),
            },
          });
          createdCount++;
          console.log(
            `  Created route: position=${position.storage_position_id}, qty=${quantityToPick}`
          );
        }

        quantityNeeded = quantityNeeded.minus(quantityToPick);
      }

      if (quantityNeeded.gt(0)) {
        console.log(
          `  WARNING: Insufficient stock! Remaining needed: ${quantityNeeded}`
        );
      }
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Bulk pickings missing routes: ${missingCount}`);
  console.log(`Routes created: ${createdCount}`);
};

run();
