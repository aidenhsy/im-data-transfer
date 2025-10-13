import { DatabaseLocalService } from './../database-local';

const run1 = async () => {
  const database = new DatabaseLocalService();

  const wacs =
    await database.imInventoryLocal.shop_item_weighted_price.findMany({
      where: {
        type: 'stock_count',
      },
    });

  for (const wac of wacs) {
    const detail =
      await database.imInventoryLocal.inventory_count_details.findUnique({
        where: {
          id: wac.source_detail_id!,
        },
        select: {
          weighted_price: true,
        },
      });
    if (!detail) {
      await database.imInventoryLocal.shop_item_weighted_price.delete({
        where: {
          id: wac.id,
        },
      });
      continue;
    }
    const newTotal = Number(detail.weighted_price) * Number(wac.total_qty_base);
    console.log(newTotal);
    await database.imInventoryLocal.shop_item_weighted_price.update({
      where: {
        id: wac.id,
      },
      data: {
        total_value: newTotal,
      },
    });
  }
};

// run1();

const run2 = async () => {
  const database = new DatabaseLocalService();

  const views = await database.imInventoryLocal.$queryRaw<
    {
      as_of_id: string;
      current_value_base: number;
      supplier_item_id: string;
      shop_id: number;
    }[]
  >`
  select as_of_id, current_value_base, supplier_item_id, shop_id
from v_shop_item_current
where current_qty_base = 0
  and current_value_base > 0
order by current_value_base desc;
  `;

  for (const view of views) {
    const runnning = await database.imInventoryLocal.$queryRaw<
      { running_avg_cost_base: number }[]
    >`
    select id, running_avg_cost_base
from v_shop_item_running
where shop_id = ${view.shop_id}
  and supplier_item_id = ${view.supplier_item_id}
order by created_at desc limit 2;
    `;

    if (runnning.length === 2) {
      const wac =
        await database.imInventoryLocal.shop_item_weighted_price.findUnique({
          where: {
            id: view.as_of_id,
          },
        });
      if (wac) {
        const newTotal =
          Math.abs(Number(runnning[1].running_avg_cost_base)) *
          Number(wac.total_qty_base);
        try {
          await database.imInventoryLocal.shop_item_weighted_price.update({
            where: {
              id: wac.id,
            },
            data: {
              total_value: newTotal,
            },
          });
        } catch (error) {
          console.log(
            `${Number(
              runnning[1].running_avg_cost_base
            )}\n${wac}\n${newTotal}\n-----------\n`
          );
        }
      }
    }
  }
  console.log('done');
  process.exit(0);
};

run2();
