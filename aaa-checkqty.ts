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
          'b1b87125-5359-445e-87ab-24f4ae29f4bd',
          '5bab89f2-09fe-4d63-8094-54e4fcb9a0ed',
          '58c5dbb8-fa58-4a29-ae8a-0c5363021d93',
          'ac1a5937-ff48-4f24-b2d5-b72c56cac2a2',
          '3c78c0f3-15fc-40d2-ba70-668e4834a100',
          'f3ca7594-9b1a-40ed-b574-47fcbf384092',
          '32ea3175-40dc-40c5-af13-5b63676ffa88',
          'd1447976-69f2-430f-960e-3accbeef5af8',
          '15611bde-5a60-4c47-9718-f8e84f2e3d28',
          '69b5a80e-dca5-450e-beb6-739ac23b4b66',
          'f5579847-534c-4ae9-a237-c25be723f0aa',
          '85ed7d21-efe6-4d07-87dd-1837fc872ec8',
          'f36041e9-a503-4b8c-baf7-7a7cbdcdbcec',
          'b7c58eaf-db3d-466c-b0ec-4bd7e5f42fd7',
          '7e6eaaa7-8dde-4bc3-aa1b-208dd2743ee1',
          'c6795ab6-f623-42d3-8bff-7faacd2c73d0',
          'ea8a2883-8dc2-44d2-9a99-0715b1637ca0',
          'dffb55dc-305c-4849-8d69-cc4bad22a583',
          '04da0d85-04bf-464b-abfc-c16bce1f7a7d',
          '25055292-7324-4ef3-8111-41b23883f267',
          'f83f4ac9-99f4-4cfa-b923-c682d7646b17',
          'bf041a46-294d-4d04-8152-2dfe4e967beb',
          'e51714e8-ad25-4136-b77e-f4abcd3f3b06',
          'b676b821-535d-494c-8356-4cc1fc45a1a5',
          '541a454d-7606-4c39-858d-6d56e2e55e03',
          'd5e074e9-3803-47ee-9963-51726576b970',
          '1c1e5d0f-5348-4d5a-983d-196dde6ac0b8',
          '8bbec4a8-de6c-4b39-9963-27366a8e750c',
          'c3703d70-e26b-4e9a-b2e8-8b498507ae15',
          'd717d8e6-9563-48d5-ab2e-c08aecdd3387',
          'f823ccc9-bc45-4291-8bfd-10a8975e7e9d',
          'f56526b9-5f8d-4dbe-9b84-fc7282e2e1a8',
          'd079265d-a86f-45ac-8e28-d9ccc5bf1e06',
          'c704ebf8-355f-44a3-b3d1-e691b3d2d239',
          '97cce7f1-de45-4a58-8ae8-c51f8c54e26e',
          '3a7ccd4f-b7d4-4f42-b2ba-9565b1b987eb',
          '1bc82252-473c-4aa2-a9b4-f47c3e3d2321',
          '2e72f532-3736-472e-b53b-e11960266edc',
          'fba567d3-0cf4-46bd-8847-0ba7e249ffec',
          'f3b3e1d5-48ad-4dc2-a735-0af2940bd504',
          '2ae16a1a-6c21-4f7c-b413-292953a8c085',
          '6dfafc2a-6815-4c2a-b950-bd5a398d9a54',
          '5d27c87c-4fc7-4540-9b8a-f7208efd1d07',
          'd65dfd0a-4617-45a0-b6d8-f0d74fdd7382',
          'eb22fb4d-d9e2-4f6b-b259-dc0845df406b',
          'a13474b4-2e5e-4b79-a7b7-580b3f02fcf5',
          '472ab316-a996-4f0d-9190-1e7ea6bf1d8e',
          'b47201dc-13b1-42a9-831e-c4440ef75e1b',
          'ee83d8a1-fe6e-40f8-b4de-b3683248c6ac',
          '8a7638ec-a73e-461f-a5e4-c31e12f46e8a',
          'b4e9495d-1d42-4eb6-98a3-7f74cf67b63f',
          '879e4898-1a60-44ab-899b-f38996d238b1',
          '9038548a-2a89-4ef7-bafa-e36ad1c43af3',
          'ffd6cda3-4904-4a62-98bd-f0447de09bf5',
          '380b033d-dc3c-4b14-aee4-45046dade649',
          '688ff26d-5c07-4c9a-8866-542f0bf68b94',
          '9726a6db-58c5-46e9-a4e9-190acf22f78d',
          '6d4fb79d-e392-4fcd-85aa-b41cfd09e2e1',
          '4502081c-a89a-4de2-ab05-41794f30575e',
          'b754aae0-72bc-4e56-8bd9-48252a551624',
          '3a6bb3f4-c616-4d85-bf99-565a9f54c062',
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
