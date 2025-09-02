import { DatabaseService } from './database';
import axios from 'axios';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.imProcurementProd.supplier_orders.findMany({
    where: {
      id: {
        in: [
          '0562548a-0610-44da-a9df-39a551daf027',
          'ac58da2f-6244-4aa1-92ce-c81a11d7b474',
          'a00f4550-2c63-4244-b854-f4e8be70a998',
          'b6968234-d909-4d8e-82cb-538aca00910d',
          'd7daa811-cccc-4cd2-954f-8e022d875c69',
          '241d81ae-e2e0-4ab5-ba3d-4c3134474cf3',
          'ace95549-82ac-457e-819b-e996513f01f6',
          '2ecae4fb-25af-4a6e-9605-eefc3065c7ea',
          '690d02d8-7b7b-4563-b496-3a37467dd279',
        ],
      },
    },
    include: {
      supplier_order_details: true,
    },
  });

  for (const order of orders) {
    console.log(order.id);
    const { data } = await axios.post(
      `https://scmms.shaihukeji.com/order/place-order`,
      {
        store_id: order.shop_id,
        client_order_id: order.id,
        type: 9,
        items: order.supplier_order_details.map((item) => ({
          name: item.supplier_item_name,
          price: item.price.toString(),
          qty: Number(item.order_qty),
          reference_id: item.supplier_reference_id,
          photo_url: item.supplier_item_photo,
          cut_off_time: item.cut_off_time,
        })),
      }
    );
    console.log(data);
  }
};

run();
