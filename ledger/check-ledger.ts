import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const ledger = await database.imAccountingProd.inventory_ledger.findMany({
    select: {
      biz_type_id: true,
      total_value: true,
      source_detail_id: true,
    },
    where: {
      created_at: {
        gte: new Date('2025-09-01T00:00:00.000Z'),
      },
    },
  });

  console.log(ledger.length);

  const inIds = ledger
    .filter((item) => item.biz_type_id === 1)
    .map((item) => item.source_detail_id);
  const outIds = ledger
    .filter((item) => item.biz_type_id === 2)
    .map((item) => item.source_detail_id);

  const missingInIds =
    await database.imProcurementProd.supplier_order_details.findMany({
      where: {
        id: {
          notIn: inIds,
        },
      },
    });

  const missingOutIds =
    await database.imProcurementProd.supplier_order_return_details.findMany({
      where: {
        id: {
          notIn: outIds,
        },
      },
    });

  console.log('missingInIds', missingInIds);
  console.log('missingOutIds', missingOutIds);

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
};

run();
