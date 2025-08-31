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
          'a6641412-9517-496b-bf6f-41446dad4c0d',
          '3a06c942-b4f0-46c7-81b9-120be2a1650b',
          'b53cd14e-b743-4ef3-8337-5430c9866665',
          '887e542d-593e-44d8-891f-5c8c4e728b40',
          'ce29a8fd-5359-43a7-a7d7-e647fdd6c132',
          'c19af095-9c8b-40ca-8d27-163ed032055a',
          '8cc1de10-f9cd-4107-8084-57a6a05e62a4',
          '3b4b8007-524a-41de-80cf-bae8fcfa950e',
          '2665ecc6-0c4d-41cf-ae22-10dccab050b0',
          '0c0c98ac-06c4-4a79-95b7-8fc1ef178506',
          '9e9f7c1d-2d23-47f3-bb4f-750bf1a251ed',
          '00347f7a-a705-49ec-a250-1aacfddf4026',
          '908245c9-1bda-4fed-80f1-8722cf11dd7d',
          '8426e9a6-08e8-4ee5-b63d-e5ec0993bd03',
          'a86de8c0-5f66-4117-ae1a-8fe66720cabe',
          'cf304d3d-8953-423e-8a9d-a1ad6354ca5a',
          '825b9aab-ca06-4cfc-8bb0-bca7bf35c544',
          'c9f4409b-3431-40aa-8a25-b0f68e8cc00c',
          'dab1e2f5-2b02-4002-a4a7-f9ad1e1874f1',
          '08ae3674-b2ca-4787-b037-65caa9bb5a16',
          'cd4d21b1-0087-42cb-8813-fe70e7d05b30',
          '9222e1af-b2f7-417f-a42d-4f8dd041e21a',
          'c75a8f30-a0e9-4a58-b0c8-f0b77a66fa40',
          '60bc2afd-9cfc-474b-8a82-e9cdf066a35d',
          '224fdb36-ca7a-4510-9874-4f549413abc3',
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
      continue;
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
