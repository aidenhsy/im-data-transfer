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
          '94812dfd-3142-4e15-a722-5d770a13218f',
          '380b4a3e-af84-4f7d-bfcd-c22f2f332715',
          '9807c181-916e-4035-8730-a044ec536ade',
          '9e85d1c0-4787-47fc-9fc0-f0cb58dae833',
          'c6ecbf40-d7cd-4552-aaf4-52efe61ec1a5',
          'ee3b0951-d118-4a91-a0a0-9318f68ed8d9',
          'e3f80d24-471a-4005-8ee8-73b9571748e7',
          '5012aa7e-0ef8-4024-975e-5b627cfa80e4',
          '122b9bc9-288c-4c5d-bfc1-afeba0631f94',
          'f4305e9c-d456-42c9-91a4-84f59ef269e6',
          'b1b87125-5359-445e-87ab-24f4ae29f4bd',
          'cd5a93a3-1dbf-400f-b261-580e66ecd1c3',
          '5be37d92-af20-4e0c-b5fb-61ce880ba1cb',
          'c5fa72e8-e9a1-424b-90c7-b0e80358b03c',
          'c5316942-62d3-4fb3-83a5-282922a4caa5',
          'ed4034b7-b81a-4a8c-8f63-22e9a419f033',
          'f7910444-1347-43d8-8082-4e59249cfcfd',
          '09ae3766-79a0-40c9-9d32-1dc5ceea7a82',
          '6b36166c-1b90-4c33-9820-5ad481ad04c1',
          'cbb2a039-75f3-4495-ac4c-dc7e0e9406a7',
          '49aa1a4c-041f-452d-847a-f3fd41d57ac6',
          '98ed57f9-4311-42ce-b781-123d0fb5bad4',
          '65d8fb81-62ee-49c1-9198-22c26da77c08',
          '5bab89f2-09fe-4d63-8094-54e4fcb9a0ed',
          '68194f34-4489-4924-8be0-0d88af8d1ee2',
          '1322e7bc-a07f-415e-b971-db08ec64649a',
          '69f02cce-50f9-43de-b80a-0cd19633b021',
          '40d44108-657e-4688-8fa2-c3ff13bb67bb',
          '1d72f799-33d1-4eda-9c79-60423bde5890',
          '58c5dbb8-fa58-4a29-ae8a-0c5363021d93',
          'e85fc3f8-b413-47d6-9d75-07325d9ddbb6',
          '5b5292ef-9abd-4516-9530-3c9bbdd0dd74',
          '066fe9fe-565a-4cda-ade1-1b1470a173a8',
          'efbd47ea-912c-48e8-84fd-69dbd3ac94af',
          'f664c9d4-dce6-4f22-bc01-90e6f0ddd59c',
          '3c4072b7-1c9a-47ef-99b0-158968686a31',
          '75eea321-dad3-4f76-a9a9-5fc65c1afb6e',
          'f13b91d7-d6f7-4f41-a584-fab0b3610ad5',
          '4f3e440b-f6ab-4dcb-926f-bfb2c1e83116',
          'd8786b35-2848-4209-a237-56577c8bd19d',
          '8099b248-0c21-492f-ae86-5d921663ce9a',
          '6121350b-93b4-47b6-bf19-2e8e70f42922',
          'db4c7b8e-90de-4160-9430-ad1b7c160c71',
          '641d8199-669d-4e2c-bced-4a53ad65f436',
          '93b96798-e8b9-4cdf-b352-2e735fc98cb4',
          'a2ede4a6-3d12-476b-be2c-606092db4eee',
          'b27cfca1-8846-4906-958c-6d6a7a465f3c',
          'd60a4ec1-caa2-4a8d-a540-1b4a30781e75',
          '04eaf73c-65fb-47af-9925-d9dee3adbc76',
          '006755c5-d1c0-4004-aaad-8524ac837b3d',
          '20e186d1-da52-46ad-b790-398f27ef460e',
          '9877bd83-64ec-4a12-837b-e6e22066cd3b',
          'c74aab3a-2823-427e-b875-58222103440a',
          '51e11f52-11ed-4189-be9e-8d060d8a73f5',
          '22928657-6e77-4471-86f7-009ac98b4187',
          '9390bdd7-8e24-4960-b71a-ba813f6d6d5c',
          '00190e3a-0c98-4108-ad69-3604d4c224fd',
          '4340d13e-af80-4432-8753-62d8b3c1063c',
          'cd411126-a18d-4dd6-a0fe-1108f54fa782',
          'f7e68b24-e2dd-4947-96e7-79c1051cf50d',
          'e8e47ab1-462d-4ce5-add7-4ac6ee60fd2b',
          'f8967d17-dd82-47ea-8be2-455b455a420e',
          'bd8f6137-6787-4e67-aec2-2319cb6e55b5',
          '7aced27d-892e-4cb5-8af9-90912a799b50',
          '008fc781-1c4b-4251-b5fc-16dce1f3f773',
          '6a773652-248d-435d-b9f4-12f947c820b5',
          'f3953a4e-ecf9-403e-a907-8915b0c6bfd3',
          '70ab4fc5-259a-4b6a-95ff-4431b2dcfc78',
          '632b99f0-b80d-4991-b7ff-77eae500e8f2',
          'c495d24a-c90a-4564-8d68-73594346d53a',
          '938a3e22-180d-41a9-a107-59f6028febb3',
          'e2fc7cd9-e321-4df3-81f8-09115a829a89',
          '8f9b5ec9-df3e-4b70-83da-64637aad36cf',
          'ac1a5937-ff48-4f24-b2d5-b72c56cac2a2',
          '850249a1-06ff-480e-9430-8fad083103a6',
          'ed407b0a-d1d4-4557-8e33-e14127a0a168',
          '3c78c0f3-15fc-40d2-ba70-668e4834a100',
          '165f0bfa-fc96-4f11-8ad3-1854b2f2f9f0',
          'f3ca7594-9b1a-40ed-b574-47fcbf384092',
          '747db57f-77f9-49e3-9447-c7ad3d8469d1',
          '128bacb9-9bda-4878-b87f-6117fe6ad3ed',
          'f80a3600-c281-4f50-8f95-28f1db23d30e',
          '435689b1-5321-4869-b9e1-1f6d2c68ef53',
          '39b5eaa6-6bbe-44c0-83db-235859c7b56b',
          '2292e13b-aa7f-43ae-ab72-36e20136a478',
          '21203ba2-5cda-4507-bdbe-4ca48576ae2b',
          '11690248-6a92-4335-8331-2ba848db847d',
          'b4505bfa-56ca-4e43-a74f-9df9136c6683',
          '6fd6d333-51fb-4819-8178-463af23e50f6',
          '4e232361-4c80-453f-badc-5beb8bf43e94',
          '6d3e02c5-dd98-40eb-8308-c2fa3c4b98cb',
          'da80b774-1b2b-4856-a611-1933e29bac41',
          '39919393-f7a3-4be5-8ea5-0069a03808a5',
          'a9fae9ba-e11c-4f54-8d24-c3497d711e54',
          'a82334ef-e7c4-4df4-8bfb-e43a48e45cda',
          '32ea3175-40dc-40c5-af13-5b63676ffa88',
          'd0f2f2f7-b7c8-4251-93a5-393e27149f3f',
          '4759cfee-daed-465e-a90c-e3b3cff66cf8',
          'fd506f8d-a320-4da9-8488-b7d9a98e391a',
          '1221a3a7-b082-43fc-8e54-3b35c4100109',
          'd1447976-69f2-430f-960e-3accbeef5af8',
          'bc4ee0ce-a3eb-4d86-a99b-8509158592a2',
          '334c0423-0f0d-41a1-a4a9-6bce66967d5c',
          'ba1b2737-a23e-4bfc-85c7-903006c52c9d',
          'a67cc39c-189c-4cb9-b175-e50e9f079ab7',
          '4b78d7f8-b61a-44c2-90ce-e999ba6c3314',
          '585ed054-ac27-478f-850d-29cd44a60836',
          'b8fe4641-9bbf-4a4f-9236-64d01771bd43',
          'fd284676-0eeb-44be-82df-3002d7681694',
          '10b86554-71eb-406c-bb41-16b7ebbfbf83',
          'e03d4c8b-148b-4274-8785-4b2689839696',
          '3556f9cd-b9c0-4b13-bb1b-86b700d1343c',
          'df2f5335-e2e9-4a17-90a9-48eeafeddb21',
          'be62432d-5182-419b-a4e9-f1ba287c8346',
          '17d5ac70-7760-40cc-9229-78ce693b2555',
          '8e837cfd-2e67-4b36-a429-e7df5650ec72',
          '65c85b20-f41b-4785-9582-0acd08558cea',
          '3e707671-4191-4e7a-8d8f-e8b85da98c9c',
          '79ec7df1-e5c5-4ff8-a7a9-ae24f0175305',
          '189fc94a-58b5-4f75-a6c6-6c38e6eed888',
          '527b2b87-1210-4985-85ca-789eef474c32',
          '5360bccf-a482-4cea-a29f-74d59fe4f4f0',
          'b5d05ff1-5a03-444b-b2d7-af2476b70e69',
          '3a56d8ac-1a0d-460f-bafa-a9c1ffafd1ff',
          '80db9305-31bf-463a-b2e5-022cc1e6625a',
          '9f43a3be-d410-46e8-a5b9-cc9afac4335e',
          '76f5287e-07d4-4212-b52b-35076dc26bdb',
          'cf09acd5-4cd7-41b3-b161-adfd8b7e0bda',
          'c4f70b71-d9d8-4a17-ae6a-6e3b5d982f5b',
          '36c312d1-2909-4ad5-86f4-ebf577b64030',
          '5aa17699-2f6e-4636-b599-12bbdcd1e940',
          'b225598a-4785-48c3-9bfb-471258047a1a',
          '205c8633-da6c-4475-8d90-1d5fb6cbc419',
          'f392bec9-6135-498d-afe8-4a1faaff3627',
          '1a10f447-0d37-405b-a01d-d75aa20d4898',
          'e7f616e2-f1d9-4880-bcae-c3e7b85239a7',
          'b6aa8a33-92e5-40f4-b1a3-2319203f661e',
          '28b09810-e809-4459-b036-94bac4815734',
          '3856ff0b-49d2-4fd6-b41c-b46c0d73b7a4',
          '35173491-1902-47c1-8a80-14f6b58d5b69',
          'b7179214-7922-4205-9fc0-ca69cd452e55',
          '25027990-6d32-46c2-bd83-44ec447c273b',
          '6317160d-f9ce-4384-9bdd-c8f7353c4a69',
          '57c5fbc2-d2af-461a-b6f5-11bc434204d9',
          '54a0f337-61b9-46ea-90f9-d59c4820df34',
          '4bd0a4d1-3101-4a22-957c-85d0d17de0d7',
          '66d62050-8b1c-4fe5-95b5-73dd7cf6f98a',
          'dbf884fa-8664-4757-9da6-8ffd9f1bdc47',
          '1d4ee033-0e8b-4c46-a9de-2297d983f97c',
          'eb8143fd-0d28-4949-b817-b31526b6bc9d',
          '6ccdf793-2fa9-4302-92d7-4675b86f04f0',
          '20b10dd2-fe50-4587-9609-c4f40f8a427f',
          '0327641b-b2b3-4d3f-8630-04beeeceda16',
          '9a3de037-acd9-463b-8639-37598731743d',
          '97a91796-78e5-4a99-944a-2fe940e53ecc',
          '9fbe6cdb-1a18-4ca7-9914-5e559eac14b7',
          '3693dde0-4046-4e8f-92dc-dedd7e3a00b1',
          '12541898-e5db-45d6-94f6-5bcc7d005d47',
          'f9976620-b7da-46b2-9805-1ecf68abe620',
          'f6d10d90-f6f3-4613-a6b5-4c08d082b0de',
          '0a276103-4db9-4f62-8602-6a859c3aa006',
          '386affde-3746-4654-9d46-e47765fcc402',
          '5c94eb5e-6762-41b2-81ef-61f6a6c99407',
          '12759f24-50a8-4c2a-a3a2-a647fd84671b',
          '41ef8f49-0f0e-4d3c-a4bd-cbfb85edfdb0',
          'ea3e824a-532c-4ac0-a046-05627f4cb460',
          'f74fa2a9-dfc4-444b-9b08-29814b68965a',
          '082b921e-1c8e-4703-b56f-88845fd47707',
          'fe8a0de4-5bfb-4641-9ebb-beb7ee3e6e47',
          '6a9779f9-bc5f-4e95-b85b-4b3541054ce7',
          '77b45861-baca-40d8-94b7-bba404848a71',
          '35741f46-7763-446f-8a22-75489e88a19d',
          '14d64627-00b6-432c-9c89-1556e3a6cd03',
          '8a41e791-e45d-4cbb-b5e6-7e9a3c2159c5',
          '6c29dd85-aeff-4c0c-81be-65a32ba1fcae',
          '3c3e7db1-3605-46f2-9c26-43ee48f17ad6',
          '4aab2320-3c25-438e-8d65-b26142d47a83',
          '72ff92d4-6cea-4dbf-8dec-409c1bac3aff',
          '9878efba-de36-4e7e-827e-0576898a7150',
          '9d1fae3f-dbb3-43f5-a25d-613a107abc2e',
          'f4c89e27-1883-4615-aa83-07836b947014',
          'a5bbc219-bc25-4a5b-a8ec-15c82fa40a74',
          '8008626f-2af4-4742-80d5-b4cf3e33bacd',
          '11dd2e6a-6fff-4220-86b0-97ca07231461',
          '2d04b935-32a6-46fa-8037-eac4d4470c25',
          '06b77c67-f6f2-4c9c-9285-1b9c08570054',
          '971bfe1a-968b-44d2-b4e6-f73343c3cce7',
          '37de16cc-38a4-4151-92a2-f77b26841cc8',
          'b7c58eaf-db3d-466c-b0ec-4bd7e5f42fd7',
          'f7bf0753-d3c3-4cc6-a9db-e116dd542c02',
          '33e42644-088e-4388-855c-9704aaa0d96a',
          '16b623f7-8ab6-4820-af9d-3783e6e46885',
          'dae7174a-86e0-47d9-bf47-9ed317a179ed',
          'e31e4ded-f3a4-454e-a0f7-3f6b9e3af709',
          '7e6eaaa7-8dde-4bc3-aa1b-208dd2743ee1',
          '42fb5afe-04fa-4de4-9346-40a5e14b93f9',
          'e8f09635-0eea-4aae-89f9-afbaa5828888',
          '1dca359e-2cfc-4d62-873f-eabf35a89a28',
          '4778e184-787b-4ccf-b36f-769fb28ff29f',
          '68f0beec-0f56-46d4-8869-a30806f5e7b0',
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
