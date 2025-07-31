import { PrismaClient as ImInventory } from '../prisma/clients/im-inventory-prod';

const run = async () => {
  const imInventory = new ImInventory();

  const batchSize = 100;
  let skip = 0;
  let hasMoreOrders = true;

  const total = await imInventory.supplier_orders.count({
    where: {
      status: {
        in: [4, 5],
      },
    },
  });

  console.log(`Total orders to process: ${total}`);

  while (hasMoreOrders) {
    console.log(
      `Processing batch ${Math.floor(skip / batchSize) + 1} of ${Math.ceil(
        total / batchSize
      )}`
    );

    // Fetch orders with pagination
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
      skip,
      take: batchSize,
    });

    if (orders.length === 0) {
      hasMoreOrders = false;
      break;
    }

    if (orders.length < batchSize) {
      hasMoreOrders = false;
    }

    // Collect all unique shop_id and supplier_item_id combinations
    const shopItemCombinations = new Set<string>();
    const orderDetails: Array<{
      order: any;
      detail: any;
    }> = [];

    for (const order of orders) {
      for (const detail of order.supplier_order_details) {
        const key = `${order.shop_id}-${detail.supplier_item_id}`;
        shopItemCombinations.add(key);
        orderDetails.push({ order, detail });
      }
    }

    // Batch fetch all existing weighted prices in one query
    const existingPrices = await imInventory.shop_item_weighted_price.findMany({
      where: {
        OR: Array.from(shopItemCombinations).map((key) => {
          const [shop_id, supplier_item_id] = key.split('-');
          return {
            shop_id: parseInt(shop_id),
            supplier_item_id: supplier_item_id,
          };
        }),
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Create a map for quick lookup
    const priceMap = new Map<string, any>();
    for (const price of existingPrices) {
      const key = `${price.shop_id}-${price.supplier_item_id}`;
      if (!priceMap.has(key)) {
        priceMap.set(key, price);
      }
    }

    // Prepare all data for batch insertion
    const dataToInsert: any[] = [];

    for (const { order, detail } of orderDetails) {
      const key = `${order.shop_id}-${detail.supplier_item_id}`;
      const existingItem = priceMap.get(key);

      if (existingItem) {
        // Update existing weighted price
        const oldTotalQty = Number(existingItem.total_qty);
        const oldTotalValue = Number(existingItem.total_value);
        const newTotalQty = oldTotalQty + Number(detail.final_qty);
        const newTotalValue =
          oldTotalValue + Number(detail.price) * Number(detail.final_qty);
        const newWeightedPrice = newTotalValue / newTotalQty;

        dataToInsert.push({
          shop_id: order.shop_id,
          supplier_item_id: detail.supplier_item_id!,
          type: 'order_in',
          source_order_id: order.id,
          source_detail_id: detail.id,
          created_at: order.receive_time!,
          updated_at: order.receive_time!,
          weighted_price: newWeightedPrice,
          total_qty: newTotalQty,
          total_value: newTotalValue,
        });
      } else {
        // Create new weighted price
        dataToInsert.push({
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
        });
      }
    }

    // Batch insert all data in a transaction
    if (dataToInsert.length > 0) {
      await imInventory.$transaction(async (tx) => {
        await tx.shop_item_weighted_price.createMany({
          data: dataToInsert,
        });
      });
    }

    skip += batchSize;
  }

  await imInventory.$disconnect();
  console.log('Processing completed successfully');
};

run().catch(console.error);
