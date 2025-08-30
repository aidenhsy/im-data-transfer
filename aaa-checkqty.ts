import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from './prisma/clients/scm-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';

const run = async () => {
  const procurementDB = new Procurement();
  const basicDB = new Basic();
  const orderDB = new Order();

  const details = await procurementDB.supplier_order_details.findMany({
    where: {
      order_id: {
        in: [
          'f5579847-534c-4ae9-a237-c25be723f0aa',
          '85ed7d21-efe6-4d07-87dd-1837fc872ec8',
          'e1f4cd17-9100-4906-86d3-5e526ffc607c',
          'f56526b9-5f8d-4dbe-9b84-fc7282e2e1a8',
          '472ab316-a996-4f0d-9190-1e7ea6bf1d8e',
          '094b6d33-e0a2-4892-878c-c4cac1762908',
          'cd0bcec2-e89d-4aa6-92e7-eee249b0aba7',
          '14979ab3-bdc2-40a8-a6fc-83da31a2f3bc',
        ],
      },
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
        `basic sent: ${basicDetail.deliver_goods_qty}, basic delivery: ${basicDetail.delivery_qty}, detail: ${detail.actual_delivery_qty}`
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
      continue;
    }

    if (Number(basicDetail.delivery_qty) !== Number(detail.final_qty)) {
      console.log(
        `basic: ${basicDetail.delivery_qty}, detail: ${detail.final_qty}`
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
