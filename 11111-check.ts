import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const shops = await database.imProcurementProd.supplier_orders.findMany({
    distinct: ['shop_id'],
    select: {
      shop_id: true,
    },
  });

  for (const shop of shops) {
    const details =
      await database.imProcurementProd.supplier_order_details.findMany({
        where: {
          supplier_orders: {
            shop_id: shop.shop_id,
            status: {
              in: [4, 5],
            },
          },
        },
        select: {
          total_final_amount: true,
        },
      });

    const total = details
      .reduce((acc, detail) => acc + Number(detail.total_final_amount), 0)
      .toFixed(0);

    const scmOrder =
      await database.scmOrderProd.procurement_order_details.findMany({
        where: {
          procurement_orders: {
            shop_id: shop.shop_id,
            status: {
              in: [4, 5],
            },
          },
        },
        select: {
          total_sale_amount: true,
        },
      });
    const totalSale = scmOrder
      .reduce((acc, detail) => acc + Number(detail.total_sale_amount), 0)
      .toFixed(0);

    if (Number(total) !== Number(totalSale)) {
      console.log(shop.shop_id);
      console.log(total);
      console.log(totalSale);
    }
  }
};

run();
