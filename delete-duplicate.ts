import { DatabaseService } from './database';

const database = new DatabaseService();

const run = async () => {
  const orders = await database.imProcurementProd.supplier_orders.findMany({
    distinct: ['shop_id'],
    where: {
      type: 3,
      created_at: {
        gte: new Date('2025-08-29T12:00:00.000Z'),
      },
    },
  });

  for (const order of orders) {
    const totalOrders =
      await database.imProcurementProd.supplier_orders.findMany({
        where: {
          shop_id: order.shop_id,
          type: 3,
          created_at: {
            gte: new Date('2025-08-29T12:00:00.000Z'),
          },
        },
      });
    if (totalOrders.length === 2) {
      const deletedOrder =
        await database.imProcurementProd.supplier_orders.findFirst({
          where: {
            shop_id: order.shop_id,
            type: 9,
            created_at: {
              gte: new Date('2025-08-28T20:00:00.000Z'),
            },
          },
        });
      console.log(deletedOrder?.id);
      await database.imProcurementProd.supplier_order_details.deleteMany({
        where: {
          order_id: deletedOrder?.id,
        },
      });
      await database.imProcurementProd.supplier_order_status_history.deleteMany(
        {
          where: {
            order_id: deletedOrder?.id,
          },
        }
      );
      await database.imProcurementProd.submit_cart_attempts.deleteMany({
        where: {
          order_id: deletedOrder?.id,
        },
      });
      await database.imProcurementProd.supplier_orders.delete({
        where: {
          id: deletedOrder?.id,
        },
      });
      await database.scmOrderProd.procurement_order_status_history.deleteMany({
        where: {
          procurement_orders: {
            client_order_id: deletedOrder?.id,
          },
        },
      });
      await database.scmOrderProd.procurement_order_details.deleteMany({
        where: {
          procurement_orders: {
            client_order_id: deletedOrder?.id,
          },
        },
      });
      await database.scmOrderProd.procurement_orders.delete({
        where: {
          client_order_id: deletedOrder?.id,
        },
      });
      console.log(deletedOrder?.id, 'deleted');
    }
  }
};

run();
