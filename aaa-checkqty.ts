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
          'ada19353-415f-42a6-86e0-04c846e90a79',
          'bef6aa91-5a8b-4d15-a4bf-cf5d3c1177be',
          '0ef8c4ae-17db-46df-9076-b35e823f724b',
          '381a25bb-9961-4c5a-ae38-27768dc55944',
          'bbe684a2-e85d-4e73-ac54-b0d13a612bcc',
          '158e022f-9f94-4311-81a9-0f3c39abc247',
          'c5b7f3c6-4471-496c-9aed-e85d7c8d8502',
          '7f974784-9b1d-46c9-91a6-b70d4c622e35',
          'c19af095-9c8b-40ca-8d27-163ed032055a',
          '92283ae3-5d1a-43e0-b07e-58bc1374f0b9',
          '22b0da79-8437-48cf-b94a-dbc029bf8be1',
          'a06a96b6-2d89-45f3-b64b-3b9311811613',
          '089229b7-1ab5-42f4-b7e1-94c8100229b2',
          '5f20bf28-b890-4480-ae9f-0dc43bc20cde',
          '7e3d2085-d68c-4ed1-9887-0408526639ee',
          '43009d15-bde2-481d-9105-b3ebb7ee6483',
          '6338b874-c69e-496e-a708-6cdbe29a11d1',
          '29ef8af3-3031-42de-8dea-894d5c0a4bc7',
          '1e469935-8729-422a-bead-534f48bd9b66',
          '84be1a14-fc46-4730-b2e2-7cd8afd347ec',
          '2cdd7fb2-e628-4bef-b6a4-fc972460ff76',
          'f3b32ed3-67a6-4498-8387-ab84ac02e70a',
          '3e2fb122-f9bb-4ff3-9048-06e66ea9d21a',
          '1182fa24-3f4b-480b-9108-aec73ac17ff0',
          'ccff71c6-9687-473f-858e-571b545068de',
          '7dc02817-fe53-4632-bad0-7b1096a95b57',
          '43837005-a18e-4f76-8773-665f267cbd12',
          '3b4b8007-524a-41de-80cf-bae8fcfa950e',
          'cec58d9d-cb3e-4607-a1d0-b218468506e5',
          '5adaf823-b608-493c-96d0-7df3766887dc',
          '9d4267ea-b11c-4599-ba54-de95e22eb559',
          'c79d5e3b-ed27-4ea8-ae5d-1563b7d0e6e3',
          '384a8856-0b4d-4eea-a67a-c8ecb0fb3a9e',
          '5576646c-fa42-4ad9-823e-b0e9f8e70c4b',
          '7dc19ac0-b406-4741-bd73-c98bf21f8b41',
          'f2551a1a-12ce-4b06-bc20-34cb0acf03f9',
          '04efa869-00bc-490c-9f44-6453f43c1f35',
          'c40623ec-14ac-4299-b8a1-2a0c678a8cfe',
          'cb58167f-bb8d-478b-b736-261fc7230a1d',
          'f10d49dc-69d4-470d-bb2f-2d8fc80e626e',
          'ed1d2932-af26-441d-bf0a-5f8d8814f140',
          'ee763422-c803-4d6c-90f1-7e5d46a95859',
          '49447d7d-deb6-4507-b0e7-91034d9baf1f',
          '4d25f3f3-c0bb-4f89-9a9e-d37e5524df86',
          '23184372-2c91-4ac2-a7b6-649b8543ae96',
          '572f4f7c-5591-495f-b672-e175945111e1',
          '13ac5a33-b860-44a3-b9cf-71318259c8d2',
          '0c0c98ac-06c4-4a79-95b7-8fc1ef178506',
          '682fccd5-fcf4-4361-a37d-6ec3ff66ebc0',
          '376b64b7-e97e-424e-896c-a14d7bb55d6c',
          '171144b3-21da-4586-922a-7bec029dd0d2',
          'ed3feab0-1672-4eec-a7c4-126967a0e75b',
          'fc0d6dd2-aa66-43c9-a2b0-8ad9f59f7337',
          '54f1b3e8-2c04-4e02-9d84-0834ff22752d',
          '1c138b59-592e-47bf-b5b6-d3504e0cae1b',
          'cfafbed5-57b9-44d2-b343-2081495cd924',
          '76948932-3b57-4f6b-8924-99bf914fc7f8',
          '126bf96e-0d02-4253-bf03-3cc7c71bbdaa',
          '99ce767f-0ba9-4a3b-9c4f-a3e9f87de3fc',
          '00347f7a-a705-49ec-a250-1aacfddf4026',
          '908245c9-1bda-4fed-80f1-8722cf11dd7d',
          'bfda7d75-c7f0-41c5-8dd9-1fb911fb2304',
          '8c058819-ceff-4999-98d4-192cbe85b349',
          '6e014c20-757a-4930-9984-4291dcbaa9fa',
          '3b20483d-f55f-4d1b-b023-55aa4155e62a',
          '0de10ac2-d935-4d0e-af3b-847133562e80',
          'af7ce8d9-8767-4627-b6c6-96fb12db277e',
          'a72fc3fa-24d2-4b25-b74d-048cc50545ac',
          '2b834c97-570c-4e33-adac-b9bd1521499b',
          '9d2870e0-cbbb-4692-8477-ebf424ee235a',
          '24e24048-b430-4434-bac3-633b8997586f',
          '162ee7e3-fc2e-4b12-93be-8e733040e037',
          '7eea7a29-da69-4387-ae0f-8084f562db0a',
          '517b0e31-0980-4e6b-94e0-93e132247f59',
          '20305b92-8bb9-4d74-9ff9-694d9999cbe0',
          '8cdd7829-5640-4b83-a5d2-e5b33c2bf494',
          '4c388a7c-bbe2-4de7-bdcf-28723d4073fc',
          'bfa037d9-b6f6-40c2-88e1-28f75f1e929c',
          'e5769ab3-7d66-4174-a50d-944eb0e0ee1e',
          '97ef1642-0894-4856-9ae2-9d7bbfc363e1',
          'd0529ed6-b701-450e-a815-66688066403c',
          'c8063d16-3f0e-49fe-8044-7145e62321da',
          'eb379b4b-6f4f-47fb-a2e4-81722f55caf0',
          '8b2b1614-04bb-427d-9696-23d6cc387187',
          '49bba544-d956-425b-9920-b158e0f4d8d6',
          '4a4d209d-9329-4b31-9c62-fc5b81b51a6f',
          '83cd6b1e-bac6-430a-88da-394d2024bd87',
          '17a7acb8-2470-4570-adb4-14284feb5413',
          'bd10d037-cb52-442e-82cd-16c401f7ea9c',
          '333ea11a-32cf-4f2b-86ed-f80f113fbb7b',
          '93072111-a717-424d-9a9d-f090b4585d22',
          'dd0e1690-faca-46f4-b793-28058eecfc62',
          'b2b1699c-c7e7-42e1-9259-a2156bed8eae',
          'dc9d4476-00fd-4f1d-9139-c84b428ef7ff',
          'bf91d84e-77aa-4cc3-b59f-2731dae19eac',
          'b553ba80-1da8-4b5f-aa38-a9aa34573f0c',
          'c3d59275-6ccb-4f1b-a848-ce02794d275f',
          'eb768c7c-f825-4b05-baa9-79bfede3a3ab',
          '66aa1939-8aa6-4e5c-b518-302ba8887a6d',
          '59ecd930-7106-453b-9815-c8ab0e30981a',
          '39da8027-8581-478e-8c42-c2f85507c9b4',
          'ffdc5fee-7563-4370-8373-e7e1d0c0b5e3',
          'cd4d21b1-0087-42cb-8813-fe70e7d05b30',
          'baa9ac26-b8c6-4fd3-bb9a-cbfe56eb3870',
          'c75a8f30-a0e9-4a58-b0c8-f0b77a66fa40',
          '196cc79b-a3cf-4a5a-a327-9832d73ae0ee',
          '0ed22002-3d7a-422f-9799-c0ceb4054f93',
          '224fdb36-ca7a-4510-9874-4f549413abc3',
          'fd926fc4-92f0-46fa-aa5b-dc1b7ed4741e',
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
