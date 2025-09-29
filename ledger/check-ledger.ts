import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  // const ledger = await database.imAccountingProd.inventory_ledger.findMany({
  //   select: {
  //     biz_type_id: true,
  //     total_value: true,
  //     source_detail_id: true,
  //   },
  //   where: {
  //     created_at: {
  //       gte: new Date('2025-09-01T00:00:00.000Z'),
  //     },
  //   },
  // });

  // for (const item of ledger) {
  //   if (item.biz_type_id === 1) {
  //     const detail =
  //       await database.imProcurementProd.supplier_order_details.findUnique({
  //         where: {
  //           id: item.source_detail_id,
  //         },
  //         select: {
  //           total_delivery_amount: true,
  //         },
  //       });
  //     if (!detail) {
  //       console.log('biz type 1', item.source_detail_id, 'no detail');
  //       continue;
  //     }
  //     if (Number(detail.total_delivery_amount) !== Number(item.total_value)) {
  //       console.log(
  //         'biz type 1',
  //         item.source_detail_id,
  //         'total_final_amount mismatch'
  //       );
  //     }
  //   }

  //   if (item.biz_type_id === 2) {
  //     const detail =
  //       await database.imProcurementProd.supplier_order_return_details.findUnique(
  //         {
  //           where: {
  //             id: item.source_detail_id,
  //           },
  //         }
  //       );
  //     if (!detail) {
  //       console.log('biz type 2', item.source_detail_id, 'no detail');
  //       continue;
  //     }
  //     if (Number(detail.total_value) !== -Number(item.total_value)) {
  //       console.log(
  //         'biz type 2',
  //         item.source_detail_id,
  //         'return total_value mismatch',
  //         Number(detail.total_value),
  //         Number(item.total_value)
  //       );
  //     }
  //   }
  // }

  // const inIds =
  //   await database.imProcurementProd.supplier_order_details.findMany({
  //     where: {
  //       supplier_orders: {
  //         status: 4,
  //         receive_time: {
  //           gte: new Date('2025-09-01T00:00:00.000Z'),
  //         },
  //       },
  //     },
  //     select: {
  //       id: true,
  //     },
  //   });
  // console.log(inIds.length);
  // for (const inId of inIds) {
  //   const ledger = await database.imAccountingProd.inventory_ledger.findFirst({
  //     where: {
  //       source_detail_id: inId.id,
  //     },
  //   });
  //   if (!ledger) {
  //     console.log(inId.id, 'no in ledger');
  //     continue;
  //   }
  // }

  const outIds =
    await database.imProcurementProd.supplier_order_return_details.findMany({
      where: {
        supplier_order_returns: {
          status: 1,
          updated_at: {
            gte: new Date('2025-09-01T00:00:00.000Z'),
          },
        },
      },
    });
  console.log(outIds.length);
  for (const outId of outIds) {
    const ledger = await database.imAccountingProd.inventory_ledger.findFirst({
      where: {
        source_detail_id: outId.id,
      },
    });
    if (!ledger) {
      console.log(outId.id, 'no out ledger');
      continue;
    }
  }
};

run();
