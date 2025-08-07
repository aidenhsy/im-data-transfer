import { PrismaClient as ImInventoryDB } from '../../prisma/clients/im-inventory-prod';
import { PrismaClient as ImProcurementDB } from '../../prisma/clients/im-procurement-prod';

const run = async () => {
  const imInventory = new ImInventoryDB();
  const imProcurement = new ImProcurementDB();

  const shopId = 32;
  const countId = '5db992fc-0af9-40fa-831f-02276b9f7096';

  await imInventory.supplier_order_details.deleteMany({
    where: {
      supplier_orders: {
        shop_id: shopId,
      },
    },
  });

  await imInventory.supplier_orders.deleteMany({
    where: {
      shop_id: shopId,
    },
  });

  const supplierOrders = await imProcurement.supplier_orders.findMany({
    where: {
      shop_id: shopId,
      status: {
        in: [4, 5],
      },
    },
    include: {
      supplier_order_details: true,
    },
  });

  for (const supplierOrder of supplierOrders) {
    const { supplier_order_details, ...rest } = supplierOrder;
    await imInventory.supplier_orders.create({
      data: {
        ...rest,
      },
    });

    await imInventory.supplier_order_details.createMany({
      data: supplier_order_details.map((detail) => {
        const { total_final_amount, total_order_amount, ...rest } = detail;
        return {
          ...rest,
          order_id: supplierOrder.id,
        };
      }),
    });
  }

  // breakpoint

  await imInventory.shop_item_weighted_price.deleteMany({
    where: {
      shop_id: shopId,
      type: 'order_in',
    },
  });

  const supplierOrderDetails =
    await imInventory.supplier_order_details.findMany({
      orderBy: {
        supplier_orders: {
          receive_time: 'asc',
        },
      },
      include: {
        supplier_orders: true,
      },
    });

  for (const detail of supplierOrderDetails) {
    const existingItem = await imInventory.shop_item_weighted_price.findFirst({
      where: {
        shop_id: shopId,
        supplier_item_id: detail.supplier_item_id!,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (existingItem) {
      const oldTotalQty = Number(existingItem.total_qty);
      const oldTotalValue = Number(existingItem.total_value);
      const newTotalQty = oldTotalQty + Number(detail.final_qty);
      const newTotalValue =
        oldTotalValue + Number(detail.price) * Number(detail.final_qty);
      const newWeightedPrice = newTotalValue / newTotalQty;

      await imInventory.shop_item_weighted_price.create({
        data: {
          shop_id: shopId,
          supplier_item_id: detail.supplier_item_id!,
          type: 'order_in',
          source_order_id: detail.order_id,
          source_detail_id: detail.id,
          created_at: detail.supplier_orders.receive_time!,
          updated_at: detail.supplier_orders.receive_time!,
          weighted_price: newWeightedPrice,
          total_qty: newTotalQty,
          total_value: newTotalValue,
        },
      });
    } else {
      await imInventory.shop_item_weighted_price.create({
        data: {
          shop_id: shopId,
          supplier_item_id: detail.supplier_item_id!,
          type: 'order_in',
          source_order_id: detail.order_id,
          source_detail_id: detail.id,
          created_at: detail.supplier_orders.receive_time!,
          updated_at: detail.supplier_orders.receive_time!,
          weighted_price: Number(detail.price),
          total_qty: Number(detail.final_qty!),
          total_value: Number(detail.price) * Number(detail.final_qty!),
        },
      });
    }
  }

  // breakpoint

  const count = await imInventory.inventory_count.findFirst({
    where: {
      id: countId,
    },
    include: {
      inventory_count_details: true,
    },
  });

  for (const detail of count?.inventory_count_details!) {
    const lastWeightedPrice =
      await imInventory.shop_item_weighted_price.findFirst({
        where: {
          supplier_item_id: detail.supplier_item_id!,
          shop_id: shopId,
          created_at: {
            lt: count?.created_at,
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

    if (!lastWeightedPrice) {
      console.log('!!! no last weighted price');
      continue;
    }
    await imInventory.inventory_count_details.update({
      where: {
        id: detail.id,
      },
      data: {
        weighted_price: Number(lastWeightedPrice.weighted_price),
      },
    });

    const newCounts = await imInventory.inventory_count_details.aggregate({
      where: {
        inventory_count_id: countId,
      },
      _sum: {
        count_value: true,
      },
    });
    await imInventory.inventory_count.update({
      where: {
        id: countId,
      },
      data: {
        count_amount: newCounts._sum.count_value,
      },
    });
  }
};

run();
