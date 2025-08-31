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
          '0038fe9a-91a3-4807-817f-189afd2b560d',
          '7bb57738-7125-4a8c-b725-0b1426614f05',
          '8487aeaf-94c8-4199-9199-a2c253cefb02',
          'e4edd853-cd05-436f-bbdf-cf5ddb4d170f',
          'af240845-c112-45e1-bb66-c9d0d540bddc',
          '4040072a-0070-40d9-bf38-72983bee0a56',
          'cbad1c06-8ec3-456a-9918-f385db7ff5c8',
          '7cccf1fa-15b0-43c6-b544-7c061f614eaa',
          '9c42332d-0c8b-403f-a7f5-962062065f75',
          'e436d788-9865-48c1-8e36-fe368496b4c2',
          '4f213cdb-2850-4de4-b378-9e66e02e9953',
          '6f2c1583-bcda-47ad-ae77-8e739fd10d7f',
          'ab9ea7f4-4a62-4bbe-86d3-2527b6ec8979',
          '4e91d13d-d5fa-4b8d-b163-bc769f8d37ed',
          'd830b398-b285-47ca-bf3f-61ae17ae86b8',
          '82e99fdd-fedc-48df-aebc-012af27674a9',
          '978f19bd-bd8a-4a03-b8cf-e0942927a3ee',
          'cea95604-cf16-42ed-8e36-18c513ad4506',
          '2798c646-054a-4c98-94a6-ca7eb99b0b5f',
          'c46fb235-bd6d-4a9e-8e9c-ba5addfea2c5',
          'c56df366-2880-4ac4-8ed7-ac65d3a28b76',
          '80a1090f-d655-4a2b-a7f8-f9d63fb2ed41',
          'dc95c539-fceb-4263-9f7d-d5a3712f9da1',
          'e38f8f08-ee0e-4e4b-9083-0960f1dc8d9d',
          'ed6aa86b-66dd-424e-b7c0-f611006d4e49',
          'f93e1098-035e-46b3-806a-13ab6065b216',
          'd4f11144-86ca-4cc2-a49e-aab85b0966ce',
          '6ebe1678-d3c0-4254-93a4-a98edb3c7401',
          '18a40461-e4f0-4c80-a5a3-7b0ed2750abb',
          'a2385c63-1307-4cfc-b52a-533e12e58a6a',
          'b7a86e15-a841-4d2b-9479-2617e2101222',
          'd1d7d1c9-c1f9-44d5-ae2e-7295371e44b1',
          '58d74193-e98c-4dbb-8ed2-4637d4a790ad',
          '5d1cf2cd-10db-4522-8e25-98eea4cd4a8d',
          'a17612d8-80f4-4b9a-b784-d429a8698b9b',
          '804b0629-f617-4fbf-8c2e-0b28061f8636',
          'bdaf2c1b-378b-4597-a2da-bf77af396df6',
          '67ea6552-624d-447c-a563-88cfa10b21d8',
          '030769a5-5fa7-421d-b584-01a474c26a91',
          '1d5aec2b-0753-4034-ae08-641bfb5d43ca',
          'c927aef7-06d0-4573-8bee-0aea14e98894',
          '58b1913a-ac95-482b-b56b-587a3719a8d1',
          '26c9d00a-3e60-4c7d-a054-e5b03d853550',
          'fd19e596-c6e7-4b4e-9a03-b09231c2b198',
          '8c45e827-237a-4764-a95e-5bd6d1fdc46f',
          'cb6f0c9b-39c9-4c9b-9840-1d99fd1d8300',
          '0cf97002-7247-4c27-8f34-33653cd3bdf0',
          '2542664a-035f-4000-8f17-d5e0b3aaeccf',
          '306b316e-8d80-4471-bab7-5dc70d7a53e4',
          '2d08c028-217d-48a5-a1d5-1951d49e6131',
          '83e136aa-1b3b-4e4c-a5c3-e4bb6f7a431c',
          'ebddff0d-b0c2-495a-bf28-26b958afbfd1',
          'dfa2fc07-13c1-4ce5-ac3a-352d4f32d437',
          'c9ef2e27-f295-4e95-a216-1fd17c6f809f',
          '6b5d72ad-ec94-4713-9e7c-ec98babbff4a',
          '8575b739-3f24-494e-8ebc-08aabce9a2cf',
          'b317270f-37b9-4c6c-b354-b6d4bf00475d',
          'ea4670b9-b26a-4cd4-a727-5d062a7d6b4a',
          '211e52a6-07dd-4adf-8795-0af734a24cad',
          '0291ca36-d17b-4819-856a-7f43e6bd6e94',
          'bf2c9e12-e5cb-4cad-bb7b-3d157d359fdc',
          '581b194e-11eb-4d9c-97ac-fd02bb601a5f',
          'ffdc2562-b939-45d5-8d23-6edcfb829419',
          'efab0a6e-1948-4675-a31d-7ca62bc3d0dc',
          '7891e1e9-bade-4d39-87d0-ebbf3c498fbc',
          '74f18725-db09-4b31-8907-5db4ec544353',
          'd7e12e7b-1ea7-4859-9f2e-b60ca701edbf',
          '57052d72-62c4-438a-8a7e-1ae571d62c6a',
          '5822c13c-b437-4fa0-b7ce-0287fbc1b864',
          'd405fe8c-57d3-4879-96bb-680a66f9cef1',
          '158f10ef-cbbf-4fe0-ab81-3a6443a78ee4',
          'f69eac89-1d58-4cec-b7cd-cd9236b1428d',
          'db4007ca-d360-422e-9119-81c65e8f5fd8',
          '7d07f1b3-f1aa-4493-b271-48eb966ffe1b',
          '09cf22db-5299-4374-942e-019eafe947cc',
          'a6beea30-c0a8-422e-98f1-35c7b916a67a',
          '4de42488-efb0-47ed-a202-6e3d1f4ed4a7',
          '2eb4d6db-22cd-40e1-b27c-63e4ae048c5f',
          '5d514a42-dd79-46b7-8315-4d8c6b00186b',
          '2ddd112e-1ccb-49d6-8051-945a66b7253f',
          'cdab7873-b763-400e-9fc8-f6d56a3a01b4',
          '7c20c89a-2c81-4a69-ae58-7cfed097c2c0',
          'e27d1467-45c6-4b24-9a20-1c06919c333a',
          '38eebfdc-4d26-479c-9558-e79503f12f7f',
          'b46304c0-34f5-4985-8b42-eb0d0c18325f',
          '298dc7fb-c55a-4eb0-acd4-537b878e2867',
          'beb98c12-d0c0-47eb-b405-eaa6df43d7a0',
          '6976838d-50b0-41aa-9b4b-afc912af42e4',
          'eb58d68e-20cd-4688-985c-e24c17ba3548',
          '98279cf0-e29b-4641-9a7d-044ad61673e4',
          'f83bf4f7-6417-42a4-b868-e962fc08a4b8',
          '11e7fad7-f4fd-40cb-8a5c-f9547f4b2888',
          'c7941043-8d83-43d6-be25-ad03a2437ce8',
          'b62d4f3e-5e8b-4a8c-8d81-e3a81ace1eb9',
          '6adc317d-2cdd-4cf8-8aeb-7caf434db79e',
          'be76ef1e-f93b-4140-a530-cc0975f71628',
          'e98ed635-1814-434a-a61c-bfbeba012ed5',
          '9b913290-c529-4794-96c5-4b504ff0b846',
          '31fff078-461a-4f4c-915c-e4b75b990df8',
          '5fb9a3ae-c7f8-42e2-9db6-4bfaa5e83bd8',
          '9198f89d-06f6-45c3-9089-4ab3ff8bde40',
          '0192b809-a31a-4865-a0e3-d2c0c400cef5',
          '79e3df36-9b00-4cbf-baae-910beec59e51',
          'e24c8873-b994-4767-be47-59b53620b04e',
          '656b48cf-849e-481b-b325-9fa9a5f67e44',
          'c3a37db6-a7b1-4918-aa40-33cedb1a92e3',
          'e709279a-aa30-4369-be4c-08eadee41cec',
          'cc2152bc-5443-4a2f-9403-2d71f6892669',
          '79b1017f-1cee-4045-a418-310087455151',
          '74d621c7-83ac-48f5-9796-2099f8dfd564',
          '8b82c37e-f276-4824-a30a-5fb5bef1a6a9',
          'ba2d67b7-9ecf-410a-9b0e-2ce89fc0d8ac',
          'cb1b6cf0-7fcb-4f60-be90-ed762e724e45',
          'e20c9eb9-305c-4eff-8d9a-e09be9f048cd',
          '2e96a160-31df-4f29-b3bf-53586c9e0ab6',
          '88f3e679-98e1-4d91-8247-e36851156f76',
          '28c9c002-c7ea-47c4-a20c-c985b489d272',
          'ae0ad142-9336-4b3e-8c28-0246231bb98f',
          '542315fa-a025-47dd-b2fd-37cc16fd8d72',
          'f6a61b9a-bd61-4ac6-a58a-df5bb5caf21e',
          'e7519762-de83-473c-a2a2-c6f50445ca7b',
          'c9bb279c-2301-4bef-b664-35f6d3faf734',
          'ce0ea529-9c8c-4168-a985-862a84f41e66',
          '4b0f14da-0708-4c57-962b-6bf34724cac9',
          '35d2b6d1-3983-4f53-b6ab-38ee835d21d8',
          '444c4e5c-fae7-46cc-ac69-e1529aaa61d6',
          '3e16eb03-3c66-4720-a390-5f3b52f2e4d3',
          '6a4e628d-8e02-4510-b3ca-0fb2a6b34beb',
          'd3a4b138-7c6b-4e52-9f1b-a78b9aa4f088',
          '99b3ea98-f05a-495b-9b35-bcf593b60e77',
          '2dd2066f-b3d1-497f-b865-a703ca4f3fb7',
          '93449a04-77d1-4db7-89cb-aa49e6761de6',
          '2e9b686f-3de5-4b17-8cba-ee87a955e94a',
          'a428ed62-f4b1-4e21-a0ce-50ca3fb984ca',
          '40d85866-7d93-445b-b3c0-d00b9edc4811',
          'df149ed7-9f40-4f8a-97ae-ba91ab723d58',
          'd677d5c3-82a1-422c-b05f-0d7383b327c6',
          'e80f284d-af38-4132-9e50-247b6f4e6bd7',
          'd7d6cb47-ed5c-4f21-819b-b58623f00251',
          '3dbffbc8-9476-4444-a0b4-53af285b5401',
          '13e4b1c1-cc4e-4304-ac36-420ff62dd093',
          '16b1a260-3968-4f83-84ee-49828d60a9e6',
          '5658d810-2f98-4e34-9623-5d8e2081380f',
          'd6693a8f-7b6e-4735-8112-bbd5095c62ff',
          '3eda0054-eec6-4a6d-a5b2-ff78d885f9c4',
          '26cd3791-de61-4871-afc7-f9439311861a',
          'e69bbf36-f953-4da6-b8f1-9664be9a1b74',
          '04a8b3f1-06c2-457e-b15e-cdcf7de80f04',
          'eaa6060b-295b-4053-aa39-e81ee4184500',
          '53324ecd-3947-4458-b055-5039d6773d1d',
          'f85ee29a-d648-4463-88c2-b77e0d287eec',
          'dcb0099e-67ac-4001-b248-ba640a573100',
          '713514c7-9953-4f6c-9c62-5da7e46079f5',
          '64e12ad4-7590-4b41-872f-ecb0fc174f3f',
          'dda085a1-f3d5-43af-888a-e022443c601b',
          '85b243ed-5f0e-400a-9534-444406dab210',
          '165ef1bc-e316-4bf7-a07e-ef610f395dad',
          'e740905a-b64e-4b99-8ada-ca2e47a273e3',
          '6d2a8dcb-1685-478e-817e-093e51757080',
          'e6f6f817-4df6-408b-92f2-52c954fe124c',
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
