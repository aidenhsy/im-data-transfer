import 'reflect-metadata';
import { getCurrentChinaTime } from '@saihu/common';
import { PrismaClient as ImInventoryDB } from '../../prisma/clients/im-inventory-prod';
import { PrismaClient as ImProcurementDB } from '../../prisma/clients/im-procurement-prod';

const run = async () => {
  const imInventory = new ImInventoryDB();
  const imProcurement = new ImProcurementDB();

  const shopIds = [31, 138, 140, 139];

  for (const shopId of shopIds) {
    const supplierOrders: { supplier_item_id: string; sum: number }[] =
      await imProcurement.$queryRaw`select d.supplier_item_id, sum(d.final_qty)
    from supplier_order_details d
             join supplier_orders o on d.order_id = o.id where o.shop_id = ${shopId} and o.receive_time>'2025-07-01' and o.receive_time<'2025-08-01' and status in (4, 5)
    group by d.supplier_item_id;`;

    const newCount = await imInventory.inventory_count.create({
      data: {
        shop_id: shopId,
        type: 1,
        created_at: '2025-07-31T23:59:59.999Z',
        status: 1,
        finished_at: getCurrentChinaTime(),
      },
    });

    for (const supplierItem of supplierOrders) {
      const wac = await imInventory.shop_item_weighted_price.findFirst({
        where: {
          shop_id: shopId,
          supplier_item_id: supplierItem.supplier_item_id,
          created_at: {
            lte: '2025-07-31T23:59:59.999Z',
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      if (!wac) {
        console.log(
          `shop_id: ${shopId}, supplier_item_id: ${supplierItem.supplier_item_id}`
        );
        continue;
      }

      await imInventory.inventory_count_details.create({
        data: {
          count_qty: supplierItem.sum,
          weighted_price: Number(wac.weighted_price),
          supplier_item_id: supplierItem.supplier_item_id,
          inventory_count_id: newCount.id,
        },
      });
    }
    const newCountDetails = await imInventory.inventory_count_details.findMany({
      where: {
        inventory_count_id: newCount.id,
      },
    });

    const totalValue = newCountDetails.reduce(
      (acc, curr) => acc + Number(curr.count_value),
      0
    );

    await imInventory.inventory_count.update({
      where: {
        id: newCount.id,
      },
      data: {
        count_amount: totalValue,
      },
    });
  }
};

run();
