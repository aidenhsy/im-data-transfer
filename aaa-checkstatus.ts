import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from './prisma/clients/scm-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';

const run = async () => {
  const procurementDB = new Procurement();
  const basicDB = new Basic();
  const orderDB = new Order();

  const ORDER_IDS = [
    '982cbb36-f31e-4c2e-9078-af03eae8eece',
    '05dfab63-e08b-4dc5-b647-8d6a74ff85be',
    '1f33e69d-995d-488b-82bf-04a959a42f15',
    '14ce549e-04ba-4d0a-84ff-5e717cbe3a62',
    '06b88323-2f27-41e2-a34b-ae3c9d4ea8fa',
    '8d921be9-50d3-407d-9b01-5ffeb4cd8b24',
    '25c1c6c6-10cc-45bd-8d6c-6145302e75b7',
    '53b27f77-bd4c-4be7-85e0-758ebde8b00b',
    '6917b987-a732-4578-9d52-16f613fc5108',
    '821bb40f-a7c3-42e4-887c-78790e8db13e',
    'b5e8c35f-5dc9-4c91-bcd4-408a51db84f7',
    '154d5559-6020-450c-93f4-a2df9909ad8d',
    'dbe267d9-1e9f-447d-a86e-2146ad304b55',
    'd07a9c82-dc87-4ab5-aa73-eec1ea56133f',
    'b623c6d1-e7c8-45b3-b7b2-d8722163669e',
    'dcd017f6-760c-4049-9a3b-d4ba27ade729',
    '2e21ac81-dced-4754-9e6e-9a6ec64af32f',
    '5d25d7a1-22d7-420f-8433-847b228097e9',
    '1e78037b-0c80-452f-8da6-2a3779fe8753',
    '42213560-b670-4e86-9082-656e6efb10fe',
    'efe67e9e-161c-4bec-99fa-0c7c8bf8f1c5',
    '84bd6736-d977-4658-ae1e-630e16b660bf',
    'fa07679e-9e81-4cbe-9a6a-af4e4be963b4',
    '891a9e49-ea01-407b-95d5-3f11ddd9d108',
    'b64a3f2b-212d-44d3-8fec-9af47e2ed1c6',
  ];

  for (const orderId of ORDER_IDS) {
    await procurementDB.supplier_orders.update({
      where: {
        id: orderId,
      },
      data: {
        status: 4,
      },
    });
    await orderDB.procurement_orders.update({
      where: {
        client_order_id: orderId,
      },
      data: {
        status: 4,
      },
    });
    // const procurementOrder = await procurementDB.supplier_orders.findFirst({
    //   where: {
    //     id: orderId,
    //   },
    //   select: {
    //     status: true,
    //   },
    // });
    // if (!procurementOrder) {
    //   continue;
    // }
    // const scmOrder = await orderDB.procurement_orders.findFirst({
    //   where: {
    //     client_order_id: orderId,
    //   },
    //   select: {
    //     status: true,
    //   },
    // });
    // if (!scmOrder) {
    //   continue;
    // }
    // if (procurementOrder.status !== scmOrder.status) {
    //   console.log(`Procurement order status mismatch: ${orderId}`);
    //   console.log(`Procurement order status: ${procurementOrder.status}`);
    //   console.log(`SCM order status: ${scmOrder.status}`);
    // }
  }
};

run();
