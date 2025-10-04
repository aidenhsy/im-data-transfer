import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const countDetails =
    await database.imInventoryProd.inventory_count_details.findMany({
      where: {
        inventory_count_id: '48fa07a9-89d8-4271-b8a5-1f89607b6178',
      },
    });

  // for (const detail of countDetails) {
  //   // console.log(detail.supplier_item_id);
  //   const itemPrice = await database.imInventoryProd.$queryRaw<
  //     {
  //       supplier_item_id: string;
  //       weighted_price: number;
  //       on_hand_base: number;
  //       generic_item_id: number;
  //       stock_category_id: number;
  //     }[]
  //   >`
  //   SELECT DISTINCT ON (r.supplier_item_id)
  //          r.supplier_item_id,
  //          ABS(r.running_avg_cost_base) AS weighted_price,
  //          r.running_qty_base      AS on_hand_base,
  //          r.generic_item_id       AS generic_item_id,
  //          r.stock_category_id     AS stock_category_id
  //   FROM v_shop_item_running r
  //   WHERE r.shop_id = 30
  //     AND r.created_at <= '2025-10-01'
  //     AND r.supplier_item_id = ${detail.supplier_item_id}
  //   ORDER BY r.supplier_item_id, r.created_at DESC, r.id DESC;`;

  //   if (itemPrice.length === 1) {
  //     if (itemPrice[0].weighted_price) {
  //       await database.imInventoryProd.inventory_count_details.update({
  //         where: {
  //           id: detail.id,
  //         },
  //         data: {
  //           weighted_price: Number(itemPrice[0].weighted_price),
  //         },
  //       });
  //     } else {
  //       const lastOrder =
  //         await database.imProcurementProd.supplier_order_details.findFirst({
  //           where: {
  //             supplier_item_id: detail.supplier_item_id,
  //             supplier_orders: {
  //               shop_id: 30,
  //               status: {
  //                 in: [4, 5],
  //               },
  //             },
  //           },
  //           orderBy: {
  //             supplier_orders: {
  //               receive_time: 'desc',
  //             },
  //           },
  //         });

  //       const weightedPrice =
  //         Number(lastOrder?.price) /
  //         Number(lastOrder?.package_unit_to_base_ratio);
  //       if (isNaN(weightedPrice)) {
  //         console.log('weightedPrice is NaN', detail);
  //       } else {
  //         await database.imInventoryProd.inventory_count_details.update({
  //           where: {
  //             id: detail.id,
  //           },
  //           data: {
  //             weighted_price: Number(weightedPrice),
  //           },
  //         });
  //       }
  //     }
  //   }
  // }

  for (const detail of countDetails) {
    const lastOrder =
      await database.imProcurementProd.supplier_order_details.findFirst({
        where: {
          supplier_item_id: detail.supplier_item_id,
          supplier_orders: {
            shop_id: 30,
            status: {
              in: [4, 5],
            },
          },
        },
        orderBy: {
          supplier_orders: {
            receive_time: 'desc',
          },
        },
      });

    const weightedPrice =
      Number(lastOrder?.price) / Number(lastOrder?.package_unit_to_base_ratio);
    if (isNaN(weightedPrice)) {
      continue;
    } else {
      await database.imInventoryProd.inventory_count_details.update({
        where: {
          id: detail.id,
        },
        data: {
          weighted_price: Number(weightedPrice),
        },
      });
    }
  }

  const newDetails =
    await database.imInventoryProd.inventory_count_details.findMany({
      where: {
        inventory_count_id: '48fa07a9-89d8-4271-b8a5-1f89607b6178',
      },
    });

  const newTotal = newDetails.reduce(
    (acc, curr) => acc + Number(curr.count_value),
    0
  );
  await database.imInventoryProd.inventory_count.update({
    where: {
      id: '48fa07a9-89d8-4271-b8a5-1f89607b6178',
    },
    data: {
      count_amount: newTotal,
    },
  });
  console.log('done');
  process.exit(0);
};

run();
