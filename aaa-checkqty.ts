import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from './prisma/clients/scm-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';

const run = async () => {
  const procurementDB = new Procurement();
  const basicDB = new Basic();
  const orderDB = new Order();

  const ORDER_IDS = [
    '52842c69-3b1b-4adb-be8a-88706e40ce72',
    'e3ff7f80-c4ac-470a-b054-b51fb0341c0f',
    'bd558c88-f44d-4f9b-872f-d7adadb819c7',
    'a04b22dd-c517-4d6b-8cee-7781ec334d72',
    '27db2515-5c7c-46f8-913f-f52e5a6f2d96',
    '139fd4ae-d2fa-4052-857f-52d845049198',
    '0a096556-03a2-4864-9edc-ee48927514a6',
    '415c5419-d416-4ca4-b6bb-2584b9b3f273',
    'dd1a7962-00fe-4541-928d-e3c5f6afd7ec',
    '19c3b9c5-5e2a-458d-a728-4e55719a6597',
    '4f72a870-22d8-450f-90fa-5c21fb4005ec',
    'b61c0873-dc3d-495f-a3bc-fb0bdb0a1e4a',
  ];

  const details = await procurementDB.supplier_order_details.findMany({
    where: {
      order_id: { in: ORDER_IDS },
    },
  });

  console.log(details.length);

  for (const detail of details) {
    const basicDetail = await basicDB.scm_order_details.findFirst({
      where: {
        reference_id: detail.supplier_reference_id,
        reference_order_id: detail.order_id,
      },
    });

    if (!basicDetail) {
      console.log(detail.id);
      continue;
    }

    if (
      Number(basicDetail.deliver_goods_qty) !==
        Number(detail.actual_delivery_qty) ||
      Number(basicDetail.deliver_goods_qty) !==
        Number(detail.actual_delivery_qty)
    ) {
      console.log(
        `basic sent: ${basicDetail.deliver_goods_qty}, detail sent: ${detail.actual_delivery_qty}`
      );
      await orderDB.procurement_order_details.updateMany({
        where: {
          reference_id: detail.supplier_reference_id,
          procurement_orders: {
            client_order_id: detail.order_id,
          },
        },
        data: {
          deliver_qty: basicDetail.deliver_goods_qty,
        },
      });
      await procurementDB.supplier_order_details.update({
        where: {
          id: detail.id,
        },
        data: {
          actual_delivery_qty: basicDetail.deliver_goods_qty,
        },
      });
    }

    if (Number(basicDetail.delivery_qty) !== Number(detail.final_qty)) {
      console.log(
        `basic final: ${basicDetail.delivery_qty}, detail final: ${detail.final_qty}`
      );
      await orderDB.procurement_order_details.updateMany({
        where: {
          reference_id: detail.supplier_reference_id,
          procurement_orders: {
            client_order_id: detail.order_id,
          },
        },
        data: {
          customer_receive_qty: basicDetail.delivery_qty,
          final_qty: basicDetail.delivery_qty,
        },
      });
      await procurementDB.supplier_order_details.update({
        where: {
          id: detail.id,
        },
        data: {
          confirm_delivery_qty: basicDetail.delivery_qty,
          final_qty: basicDetail.delivery_qty,
        },
      });
    }
  }
};

run();
