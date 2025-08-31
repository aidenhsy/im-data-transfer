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
          'c7bfe037-14f3-4b68-b5e8-76226e1ad052',
          'e688c745-84e5-4387-a4f0-da73d211eeb6',
          'b6c8f0ee-53b4-490c-a0a3-83f5c537b95e',
          '0056d98b-4bbb-419c-b7f8-0a065b71ddd1',
          '52f38c2d-8ea8-4c60-9dc3-3a228a267bc2',
          '2d3c3646-4c37-4eda-a08e-01a9d894d776',
          'c4e25967-b988-43e2-bd82-a83e852f699b',
          '4d033a05-b9ae-453c-b674-610f939a4fc4',
          'a72fc3fa-24d2-4b25-b74d-048cc50545ac',
          '7f34de6d-5b1b-4941-9541-9b9f78e025b5',
          'c5b7f3c6-4471-496c-9aed-e85d7c8d8502',
          '33908970-dcd1-4398-aea3-f2e61601cf22',
          'c3d59275-6ccb-4f1b-a848-ce02794d275f',
          '7eea7a29-da69-4387-ae0f-8084f562db0a',
          'af4274e1-4d5f-49fd-9ab7-b6b26f5fe38b',
          'ebdd84fa-5301-4b6d-9017-2c652c3dd47f',
          '713e881e-2d50-489b-8672-94268c42273b',
          '9adf7c64-301b-4a0f-b1ab-8e131ab56814',
          '63e7aef3-8f17-4fae-8178-b8f7aa2bf131',
          'bef6aa91-5a8b-4d15-a4bf-cf5d3c1177be',
          '1182fa24-3f4b-480b-9108-aec73ac17ff0',
          'dd0e1690-faca-46f4-b793-28058eecfc62',
          'c8798887-30a5-43d9-9496-65af17c5af2e',
          'd0529ed6-b701-450e-a815-66688066403c',
          'dc9d4476-00fd-4f1d-9139-c84b428ef7ff',
          'a06a96b6-2d89-45f3-b64b-3b9311811613',
          '6e014c20-757a-4930-9984-4291dcbaa9fa',
          '4c388a7c-bbe2-4de7-bdcf-28723d4073fc',
          '66aa1939-8aa6-4e5c-b518-302ba8887a6d',
          '93072111-a717-424d-9a9d-f090b4585d22',
          'ed3feab0-1672-4eec-a7c4-126967a0e75b',
          'bfa037d9-b6f6-40c2-88e1-28f75f1e929c',
          '4a4d209d-9329-4b31-9c62-fc5b81b51a6f',
          '333ea11a-32cf-4f2b-86ed-f80f113fbb7b',
          '381a25bb-9961-4c5a-ae38-27768dc55944',
          'ed1d2932-af26-441d-bf0a-5f8d8814f140',
          '9d4267ea-b11c-4599-ba54-de95e22eb559',
          '963b5ecf-05bc-4948-8974-de3f1979fd9c',
          '162ee7e3-fc2e-4b12-93be-8e733040e037',
          'ee8904b9-b335-4c2e-a7d7-2f655fb62d8a',
          'bbe684a2-e85d-4e73-ac54-b0d13a612bcc',
          'ec1e1a76-4ab7-48bb-a830-c132c184ad84',
          '4e559440-33ea-42c0-8bc7-8e3ffc3a77c9',
          '71f04d7f-1785-40e6-862a-c2372079752e',
          '49e346e3-4327-4211-8fa4-baf8781c8e66',
          'b5290051-5c3d-496a-ab9a-4104c00dfe87',
          '23b75266-6fd0-477f-93a9-2e0faf73d36e',
          '86fc6bf3-6c45-4de1-bbb3-60e70ee8c7ea',
          '0c6dba3d-57f6-4632-a154-9632fa270581',
          'be165617-c555-492d-b994-4f71d1857f7d',
          '08fca50f-a958-40d8-918f-385ba9a43ef0',
          'c2bff825-114b-4c30-a5f2-5a5b27ef098e',
          '0b00f3b7-a6a2-4078-8e0a-560b00ad20c0',
          '73f2834d-8c9a-4a07-81be-279b6ff882e1',
          '6811628c-b7a8-4322-8c36-d8e610e0743a',
          '38ef7e40-2db5-49d5-a800-01725c137946',
          'a0c755dc-c2c5-4729-a189-100ad92a7acd',
          '126bf96e-0d02-4253-bf03-3cc7c71bbdaa',
          'b2b1699c-c7e7-42e1-9259-a2156bed8eae',
          '2cdd7fb2-e628-4bef-b6a4-fc972460ff76',
          '23184372-2c91-4ac2-a7b6-649b8543ae96',
          '0ed22002-3d7a-422f-9799-c0ceb4054f93',
          '7f974784-9b1d-46c9-91a6-b70d4c622e35',
          'cd4d21b1-0087-42cb-8813-fe70e7d05b30',
          '04efa869-00bc-490c-9f44-6453f43c1f35',
          '22b0da79-8437-48cf-b94a-dbc029bf8be1',
          '4d25f3f3-c0bb-4f89-9a9e-d37e5524df86',
          'e74628ec-8657-46c9-8284-027a6bc23297',
          'f10d49dc-69d4-470d-bb2f-2d8fc80e626e',
          'f3b32ed3-67a6-4498-8387-ab84ac02e70a',
          'b0e02dae-140c-4c44-a06d-6b638c9fbfe4',
          '196cc79b-a3cf-4a5a-a327-9832d73ae0ee',
          '8b2b1614-04bb-427d-9696-23d6cc387187',
          '24e24048-b430-4434-bac3-633b8997586f',
          '13ac5a33-b860-44a3-b9cf-71318259c8d2',
          'b553ba80-1da8-4b5f-aa38-a9aa34573f0c',
          '92283ae3-5d1a-43e0-b07e-58bc1374f0b9',
          '47cfdb3b-fe7e-495a-ade6-bec30db477c3',
          'b9fe5bcc-2b46-4482-b381-ad86d33bfb68',
          '879518c2-e9ef-4321-8cf6-cf465be84ad5',
          '99ce767f-0ba9-4a3b-9c4f-a3e9f87de3fc',
          'eb379b4b-6f4f-47fb-a2e4-81722f55caf0',
          '517b0e31-0980-4e6b-94e0-93e132247f59',
          'c755691c-f961-4308-9045-5f2edafe5f22',
          '5576646c-fa42-4ad9-823e-b0e9f8e70c4b',
          '533186c4-4fcb-40b1-a962-7d21e41da7b1',
          'bd5a5784-9a54-4d3b-a73c-d1d807b75646',
          '160d48c4-b47c-4c33-88a8-95804ebb93e2',
          '908245c9-1bda-4fed-80f1-8722cf11dd7d',
          '171144b3-21da-4586-922a-7bec029dd0d2',
          '0de10ac2-d935-4d0e-af3b-847133562e80',
          '384a8856-0b4d-4eea-a67a-c8ecb0fb3a9e',
          '3b20483d-f55f-4d1b-b023-55aa4155e62a',
          '158e022f-9f94-4311-81a9-0f3c39abc247',
          'ffdc5fee-7563-4370-8373-e7e1d0c0b5e3',
          'c19af095-9c8b-40ca-8d27-163ed032055a',
          '39da8027-8581-478e-8c42-c2f85507c9b4',
          'eb768c7c-f825-4b05-baa9-79bfede3a3ab',
          'baa9ac26-b8c6-4fd3-bb9a-cbfe56eb3870',
          'c75a8f30-a0e9-4a58-b0c8-f0b77a66fa40',
          '29ef8af3-3031-42de-8dea-894d5c0a4bc7',
          'cec58d9d-cb3e-4607-a1d0-b218468506e5',
          'ee763422-c803-4d6c-90f1-7e5d46a95859',
          '2b7d5692-414c-4c78-b091-f6691f1fc7ea',
          '59ecd930-7106-453b-9815-c8ab0e30981a',
          'e5769ab3-7d66-4174-a50d-944eb0e0ee1e',
          '84be1a14-fc46-4730-b2e2-7cd8afd347ec',
          '83cd6b1e-bac6-430a-88da-394d2024bd87',
          '43009d15-bde2-481d-9105-b3ebb7ee6483',
          '5f20bf28-b890-4480-ae9f-0dc43bc20cde',
          '1c138b59-592e-47bf-b5b6-d3504e0cae1b',
          '8c058819-ceff-4999-98d4-192cbe85b349',
          '9d2870e0-cbbb-4692-8477-ebf424ee235a',
          '7dc19ac0-b406-4741-bd73-c98bf21f8b41',
          '224fdb36-ca7a-4510-9874-4f549413abc3',
          '64278fa4-808c-4926-8126-df3c86d80af2',
          'f2551a1a-12ce-4b06-bc20-34cb0acf03f9',
          '49447d7d-deb6-4507-b0e7-91034d9baf1f',
          'c79d5e3b-ed27-4ea8-ae5d-1563b7d0e6e3',
          '0c0c98ac-06c4-4a79-95b7-8fc1ef178506',
          'cfafbed5-57b9-44d2-b343-2081495cd924',
          'bf91d84e-77aa-4cc3-b59f-2731dae19eac',
          '0ef8c4ae-17db-46df-9076-b35e823f724b',
          '16c2eef8-5644-4fdb-9750-e19f2a18de3f',
          '20305b92-8bb9-4d74-9ff9-694d9999cbe0',
          '089229b7-1ab5-42f4-b7e1-94c8100229b2',
          'bfda7d75-c7f0-41c5-8dd9-1fb911fb2304',
          '4be78fe5-1c6f-407b-8cf3-f2174ab4784d',
          '2b834c97-570c-4e33-adac-b9bd1521499b',
          '00347f7a-a705-49ec-a250-1aacfddf4026',
          'fc0d6dd2-aa66-43c9-a2b0-8ad9f59f7337',
          'ccff71c6-9687-473f-858e-571b545068de',
          '3b4b8007-524a-41de-80cf-bae8fcfa950e',
          '3c8255bc-dfb6-42d9-9366-acddcd088683',
          '4e6987db-21c9-4a40-b416-0c153a39c660',
          'b4a078ba-7a7d-4514-811b-23b24231ade1',
          '9fab7068-241d-43fe-bf0d-873bfbd93120',
          'bd10d037-cb52-442e-82cd-16c401f7ea9c',
          '3e2fb122-f9bb-4ff3-9048-06e66ea9d21a',
          '376b64b7-e97e-424e-896c-a14d7bb55d6c',
          '600a58a7-ce0f-4cd7-911e-f513577a1c55',
          '572f4f7c-5591-495f-b672-e175945111e1',
          'cb58167f-bb8d-478b-b736-261fc7230a1d',
          '682fccd5-fcf4-4361-a37d-6ec3ff66ebc0',
          '6338b874-c69e-496e-a708-6cdbe29a11d1',
          'de86d05b-7a13-4a65-8258-29ac52598847',
          '7cbf2659-6194-4851-80d0-ccd5f0b9aed3',
          'fb18e632-3bf5-4d0b-ba5e-c62932073a68',
          'b38ed654-1838-47a1-a82a-49f79c27a0f0',
          '72494dee-cc6b-4c0a-b9f8-bfaed7bf6599',
          '28209a44-a438-42fa-843b-039ea5cf1940',
          '76948932-3b57-4f6b-8924-99bf914fc7f8',
          '54f1b3e8-2c04-4e02-9d84-0834ff22752d',
          '1e469935-8729-422a-bead-534f48bd9b66',
          '97ef1642-0894-4856-9ae2-9d7bbfc363e1',
          '43837005-a18e-4f76-8773-665f267cbd12',
          '49bba544-d956-425b-9920-b158e0f4d8d6',
          'c40623ec-14ac-4299-b8a1-2a0c678a8cfe',
          '7e3d2085-d68c-4ed1-9887-0408526639ee',
          '7dc02817-fe53-4632-bad0-7b1096a95b57',
          'b1d3d5c4-f614-4513-b63c-3412e4dad3e3',
          'ada19353-415f-42a6-86e0-04c846e90a79',
          '594eca1a-e8fe-46de-abb4-be592cf60722',
          '17a7acb8-2470-4570-adb4-14284feb5413',
          'c8063d16-3f0e-49fe-8044-7145e62321da',
          'af7ce8d9-8767-4627-b6c6-96fb12db277e',
          '5adaf823-b608-493c-96d0-7df3766887dc',
          '8cdd7829-5640-4b83-a5d2-e5b33c2bf494',
          'fd926fc4-92f0-46fa-aa5b-dc1b7ed4741e',
          'fb6b4223-e94b-4e27-aee8-605f9784047b',
          '50044c42-2e48-415b-ba6f-90ab320c0d1e',
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
