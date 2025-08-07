import { PrismaClient as ImInventoryDB } from '../../prisma/clients/im-inventory-prod';
import { PrismaClient as ImProcurementDB } from '../../prisma/clients/im-procurement-prod';

const run = async () => {
  const imInventory = new ImInventoryDB();
  const imProcurement = new ImProcurementDB();

  const shopId = 32;

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
};

run();
