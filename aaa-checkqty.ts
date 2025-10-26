import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from './prisma/clients/scm-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';

const run = async () => {
  const procurementDB = new Procurement();
  const basicDB = new Basic();
  const orderDB = new Order();

  const ORDER_IDS = [
    '03e18507-fbd4-45d8-b6bf-86fc2993162c',
    '8f57d759-38bc-4aa6-ad0c-0a2e08217814',
    'a8d00a85-9555-4ac3-99ec-acea5fd82e61',
    '7a6eb75b-da77-4434-b0bf-70a3bd22a8fb',
    '4cf24f7d-e2f9-4dd8-a605-01789705f39b',
    '49ccf186-fad0-4693-9939-bb7f4b021dfa',
    '6ab064ac-aee5-41a5-95c1-325d3f5a0d74',
    '23cdee55-c5ba-43fa-840c-160962019d35',
    '10a6f107-2de9-44bb-9782-f98af9592660',
    '6d480d43-0482-4b64-bf0b-e7f2c4d0dac3',
    'f0b7997b-d7b9-43ce-8ed5-19d003ad4a31',
    '4c793107-319a-4737-b364-71369b614c53',
    '2bdaff2f-228a-4e65-8c0b-b06e2f6f9c9f',
    '7bfa0f24-88b0-40f8-8228-b9eb2d2fec10',
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
