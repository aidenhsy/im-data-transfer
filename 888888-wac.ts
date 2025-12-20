import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const wacs = await database.imInventoryProd.shop_item_weighted_price.findMany(
    {
      distinct: ['shop_id', 'supplier_item_id'],
      where: {
        shop_id: 139,
      },
      select: {
        supplier_item_id: true,
        shop_id: true,
      },
    }
  );

  for (const wac of wacs) {
    const goodWac =
      await database.imInventoryProd.shop_item_weighted_price.findMany({
        where: {
          supplier_item_id: wac.supplier_item_id,
          shop_id: wac.shop_id,
        },
        orderBy: {
          created_at: 'asc',
        },
      });
    // console.log(
    //   goodWac.map((w) => ({ type: w.type, total_qty_base: w.total_qty_base }))
    // );
    let balance = 0;
    for (const wac of goodWac) {
      // console.log(`beginning balance: ${balance}`);
      if (wac.type === 'stock_count') {
        const countDetail =
          await database.imInventoryProd.inventory_count_details.findFirst({
            where: {
              id: wac.source_detail_id!,
            },
            include: {
              inventory_count: {
                select: {
                  created_at: true,
                },
              },
            },
          });

        if (Number(countDetail?.balance_qty) !== balance) {
          console.log(
            `!!! correct balance: ${balance}, countDetail.balance_qty: ${countDetail?.balance_qty}`
          );

          await database.imInventoryProd.inventory_count_details.update({
            where: {
              id: wac.source_detail_id!,
            },
            data: {
              balance_qty: balance,
            },
          });
        }
      }
      // console.log(`wac.total_qty_base from ${wac.type}: ${wac.total_qty_base}`);
      balance += Number(wac.total_qty_base);
      // console.log(`ending balance: ${balance}`);
      // console.log('---');
    }

    for (const wac of goodWac) {
      if (wac.type === 'stock_count') {
        const countDetail =
          await database.imInventoryProd.inventory_count_details.findFirst({
            where: {
              id: wac.source_detail_id!,
            },
          });
        if (
          Number(countDetail?.delta_qty) !== Number(wac.total_qty_base) ||
          Number(countDetail?.delta_qty_value) !== Number(wac.total_value)
        ) {
          console.log(
            `!!! delta_qty: ${countDetail?.delta_qty}, total_qty_base: ${wac.total_qty_base}, delta_qty_value: ${countDetail?.delta_qty_value}, total_value: ${wac.total_value}`
          );
          const newDelta =
            Number(countDetail?.delta_qty) / Number(wac.order_to_base_factor);
          await database.imInventoryProd.shop_item_weighted_price.update({
            where: {
              id: wac.id,
            },
            data: {
              total_qty: newDelta,
              total_value: Number(countDetail?.delta_qty_value),
            },
          });
        }
      }
    }
    console.log('--------------------------------');
  }
  console.log('done');
};

run();
