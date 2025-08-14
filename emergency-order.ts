import { PrismaClient as Prod } from './prisma/clients/im-procurement-prod';
import axios from 'axios';

const run = async () => {
  const prod = new Prod();

  const orders = await prod.supplier_orders.findMany({
    where: {
      type: 3,
      created_at: {
        gt: new Date('2025-08-14T15:00:00.000Z'),
      },
    },
    include: {
      supplier_order_details: true,
    },
  });

  for (const order of orders) {
    console.log(order.id);
    await axios.post(`https://scmms.shaihukeji.com/order/place-order`, {
      store_id: order.shop_id,
      client_order_id: order.id,
      type: 3,
      items: order.supplier_order_details.map((item) => ({
        name: item.supplier_item_name,
        price: item.price.toString(),
        qty: Number(item.order_qty),
        reference_id: item.supplier_reference_id,
        photo_url: item.supplier_item_photo,
        cut_off_time: item.cut_off_time,
      })),
    });
  }

  console.log(orders.length);
};

run();
