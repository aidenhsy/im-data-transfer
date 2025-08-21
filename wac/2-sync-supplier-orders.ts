import { PrismaClient as ImInventory } from '../prisma/clients/im-inventory-prod';
import { PrismaClient as ImProcurement } from '../prisma/clients/im-procurement-prod';

const imInventory = new ImInventory();
const imProcurement = new ImProcurement();

const runJuneCount = async () => {
  const inventories = await imInventory.inventory_count.findMany({
    distinct: ['shop_id'],
    orderBy: {
      created_at: 'asc',
    },
    where: {
      created_at: {
        gte: new Date('2025-06-15'),
        lte: new Date('2025-07-03'),
      },
    },
    include: {
      inventory_count_details: {
        include: {
          supplier_items: true,
        },
      },
    },
  });

  for (const inventory of inventories) {
    for (const inventoryDetail of inventory.inventory_count_details) {
      await imInventory.shop_item_weighted_price.create({
        data: {
          shop_id: Number(inventory.shop_id),
          supplier_item_id: inventoryDetail.supplier_items.id,
          total_qty: inventoryDetail.count_qty,
          total_value:
            Number(inventoryDetail.count_qty) *
            Number(inventoryDetail.supplier_items.price),
          source_id: inventory.id,
          source_detail_id: inventoryDetail.id,
          type: 'stock_count',
          status: 1,
          created_at: inventory.created_at!,
          order_to_base_factor: Number(
            inventoryDetail.supplier_items.package_unit_to_base_ratio
          ),
        },
      });
    }
  }
};

// runJuneCount();

const runOrders = async () => {
  const orders = await imProcurement.supplier_orders.findMany({
    where: {
      receive_time: {
        gte: new Date('2025-07-01T00:00:00Z'),
        lte: new Date('2025-07-31T00:00:00Z'),
      },
    },
    orderBy: {
      receive_time: 'asc',
    },
    select: {
      id: true,
      shop_id: true,
      receive_time: true,
      supplier_order_details: {
        select: {
          id: true,
          supplier_item_id: true,
          final_qty: true,
          total_final_amount: true,
          supplier_items: {
            select: {
              package_unit_to_base_ratio: true,
            },
          },
        },
      },
    },
  });

  console.log(orders.length);

  for (const order of orders) {
    for (const detail of order.supplier_order_details) {
      await imInventory.shop_item_weighted_price.create({
        data: {
          shop_id: Number(order.shop_id),
          supplier_item_id: detail.supplier_item_id!,
          total_qty: detail.final_qty,
          total_value: detail.total_final_amount,
          source_id: order.id,
          source_detail_id: detail.id,
          type: 'order_in',
          status: 1,
          order_to_base_factor: Number(
            detail.supplier_items?.package_unit_to_base_ratio
          ),
          created_at: order.receive_time!,
        },
      });
    }
  }
};

// runOrders();

const runJulyCount = async () => {
  const inventories = await imInventory.inventory_count.findMany({
    distinct: ['shop_id'],
    orderBy: {
      created_at: 'asc',
    },
    where: {
      created_at: {
        gte: new Date('2025-07-29'),
        lte: new Date('2025-08-03'),
      },
    },
    include: {
      inventory_count_details: {
        include: {
          supplier_items: true,
        },
      },
    },
  });

  for (const inventory of inventories) {
    for (const inventoryDetail of inventory.inventory_count_details) {
      const movingRecords = await imInventory.$queryRaw<
        Array<{ id: string }>
      >`select id
      from v_shop_item_running
      where supplier_item_id = ${inventoryDetail.supplier_items.id}
        and shop_id = 103
      order by created_at desc
      limit 1;`;

      if (!Array.isArray(movingRecords) || movingRecords.length === 0) {
        console.log('No moving record found', {
          supplierItemId: inventoryDetail.supplier_items.id,
          shopId: 103,
        });
        continue;
      }

      console.log(movingRecords[0].id);
      // await imInventory.shop_item_weighted_price.create({
      //   data: {
      //     shop_id: Number(inventory.shop_id),
      //     supplier_item_id: inventoryDetail.supplier_items.id,
      //     total_qty: inventoryDetail.count_qty,
      //     total_value:
      //       Number(inventoryDetail.count_qty) *
      //       Number(inventoryDetail.supplier_items.price),
      //     source_id: inventory.id,
      //     source_detail_id: inventoryDetail.id,
      //     type: 'stock_count',
      //     status: 1,
      //     created_at: inventory.created_at!,
      //     order_to_base_factor: Number(
      //       inventoryDetail.supplier_items.package_unit_to_base_ratio
      //     ),
      //   },
      // });
    }
  }
};

runJulyCount();
