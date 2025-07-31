import { PrismaClient as ImInventory } from '../prisma/clients/im-inventory-prod';

const run = async () => {
  const imInventory = new ImInventory();

  const batchSize = 100;
  let skip = 0;
  let hasMoreOrders = true;

  while (hasMoreOrders) {
    const orders = await imInventory.supplier_orders.findMany({
      where: {
        status: {
          in: [4, 5],
        },
      },
      include: {
        supplier_order_details: true,
      },
      orderBy: {
        receive_time: 'asc',
      },
    });

    if (orders.length < batchSize) {
      hasMoreOrders = false;
    }

    if (orders.length === 0) {
      break;
    }

    for (const order of orders) {
      for (const detail of order.supplier_order_details) {
        const item = await imInventory.shop_item_weighted_price.findFirst({
          where: {
            shop_id: order.shop_id,
            supplier_item_id: detail.supplier_item_id!,
          },
          orderBy: {
            created_at: 'desc',
          },
        });
        if (item) {
          const oldTotalQty = item.total_qty;
          const oldTotalValue = item.total_value;

          const newTotalQty = Number(oldTotalQty) + Number(detail.final_qty);
          const newTotaValue =
            Number(oldTotalValue) +
            Number(detail.price) * Number(detail.final_qty);
          const newWeightedPrice = newTotaValue / newTotalQty;

          await imInventory.shop_item_weighted_price.create({
            data: {
              shop_id: order.shop_id,
              supplier_item_id: detail.supplier_item_id!,
              type: 'order_in',
              source_order_id: order.id,
              source_detail_id: detail.id,
              created_at: order.receive_time!,
              updated_at: order.receive_time!,
              weighted_price: newWeightedPrice,
              total_qty: newTotalQty,
              total_value: newTotaValue,
            },
          });
        }
        await imInventory.shop_item_weighted_price.create({
          data: {
            shop_id: order.shop_id,
            supplier_item_id: detail.supplier_item_id!,
            type: 'order_in',
            source_order_id: order.id,
            source_detail_id: detail.id,
            created_at: order.receive_time!,
            updated_at: order.receive_time!,
            weighted_price: detail.price,
            total_qty: detail.final_qty,
            total_value: Number(detail.price) * Number(detail.final_qty),
          },
        });
      }
    }
    skip += batchSize;
  }
};

run();
