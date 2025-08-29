import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from './prisma/clients/scm-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';

const run = async () => {
  const procurementDB = new Procurement();
  const basicDB = new Basic();
  const orderDB = new Order();

  const orderDetails = await orderDB.procurement_order_details.findMany({
    where: {
      procurement_orders: {
        client_order_id: {
          in: [
            '2f060948-2ccd-4aba-92e9-007c87d40000',
            '32630',
            '32720',
            '32832',
            '32991',
            '33073',
            '33122',
            '33157',
            '33241',
            '33333',
            '33761',
            '34477',
            '34630',
            '35152',
            '5d090d5e-ed2f-4612-971c-43effd050bd7',
            'ada1eab8-5f8b-4157-9a52-34b5512fa703',
            'caab9465-65e5-4e52-abdc-54498491ea76',
            'd763d54c-0dd5-4564-80c9-98a08b0787ea',
          ],
        },
      },
    },
    include: {
      procurement_orders: true,
    },
  });

  console.log(orderDetails.length);

  for (const detail of orderDetails) {
    const basicDetail = await basicDB.scm_order_details.findFirst({
      where: {
        reference_id: detail.reference_id,
        reference_order_id: detail.procurement_orders.client_order_id,
      },
    });

    if (!basicDetail) {
      console.log(detail.id, 'basic detail not found');
      continue;
    }

    const procurementDetail =
      await procurementDB.supplier_order_details.findFirst({
        where: {
          supplier_reference_id: detail.reference_id!,
          order_id: detail.procurement_orders.client_order_id,
        },
      });

    if (!procurementDetail) {
      console.log(detail.id, 'procurement detail not found');
      continue;
    }

    if (
      Number(basicDetail.deliver_goods_qty) !== Number(detail.deliver_qty) ||
      Number(basicDetail.deliver_goods_qty) !== Number(detail.deliver_qty)
    ) {
      console.log(
        `basic sent: ${basicDetail.deliver_goods_qty}, basic delivery: ${basicDetail.delivery_qty}, detail: ${detail.deliver_qty}`
      );
      await orderDB.procurement_order_details.update({
        where: {
          id: detail.id,
        },
        data: {
          deliver_qty: basicDetail.deliver_goods_qty,
        },
      });

      await procurementDB.supplier_order_details.update({
        where: { id: procurementDetail.id },
        data: { actual_delivery_qty: basicDetail.deliver_goods_qty },
      });
    }

    if (Number(basicDetail.delivery_qty) !== Number(detail.final_qty)) {
      console.log(
        `basic delivery: ${basicDetail.delivery_qty}, detail: ${detail.final_qty}`
      );
      await orderDB.procurement_order_details.update({
        where: { id: detail.id },
        data: { final_qty: basicDetail.delivery_qty },
      });
      await procurementDB.supplier_order_details.update({
        where: { id: procurementDetail.id },
        data: { final_qty: basicDetail.delivery_qty },
      });
    }
  }
};

run();
