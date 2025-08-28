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
          'e1542586-8d91-40f1-8ed4-16b45623609e',
          '57375380-9b56-4140-8262-924cd0427996',
          '380d8d97-737b-42ef-ba20-2667c3951814',
          '2899aa04-0daf-4de3-aa4f-571fb02e0fba',
          '5e549fde-60a9-468a-b076-17790470e7de',
          '3b9ecbf1-48f8-4676-b1fa-a459e2d9acca',
          'c208fec3-8cab-495d-9fb3-b651b2ff6021',
          '20449af4-9b08-435c-917f-6ea91aad49f7',
          'b7718cea-268c-49e1-899a-86525202eb33',
          'f1ebdeeb-95f4-411b-88f2-9eae1920a74d',
          '435d27f0-380d-4744-8a4e-81a63c0ef6bc',
          'a27a856b-3aa1-4d61-9fa7-147a45e689f1',
          '0f6c99f7-6167-45eb-86f0-81f7f9d4e127',
          'cdf8459f-8ad7-40e9-8c18-f3291afa79d1',
          'c2cbfc35-b2e5-4000-8684-4f8cd7cfcafc',
          'bdaf2c1b-378b-4597-a2da-bf77af396df6',
          '9895c065-5326-419d-95e1-f8dca41843ee',
          '50892da8-48e8-4d05-b987-29478c75cc27',
          '1fe8e09d-d1b0-4ced-b956-141d4e7c86ea',
          'ba9249c7-077a-4372-8216-ad2b1000f530',
          'ffdc2562-b939-45d5-8d23-6edcfb829419',
          '3b675cd0-898a-42ed-9292-6213dc5c301d',
          'e3b57f71-7010-43d7-951e-2235ed7a3a99',
          '64176faf-18ae-4b4e-9b0a-d812bce07128',
          'c0fae695-2646-4a35-a652-6d994e130bde',
          '9cc19224-71ae-4fa2-b283-cf860f07c099',
          '057e2f87-4625-4fdc-9f82-d252e867102c',
          'e6809944-f4c9-4244-8d0d-96fa75bdcc7e',
          'acbb910b-6032-4923-bedb-a0fb1adb21ef',
          '69d379da-e171-4318-bd35-7bb9eeda8372',
          'f332b7a8-615c-4bbd-a25b-4a8a65fc0eb5',
          '9152628a-8110-457c-817b-a975376bb6ad',
          '973d7dbd-cb8b-40c1-a529-4adebd8d7833',
          'a4e1f185-2f26-435a-b6eb-bcc6dbff57aa',
          '5bfe4d0a-e820-4ef4-9591-7ce01801d3a7',
          '402d83e6-1d4f-47df-8b0a-e756db8e8727',
          '04d0bada-c12f-4128-bdd2-a478c955ad68',
          '487209a5-6588-4d8c-b488-3374f24551b0',
          '1f1a950d-54f5-412b-919a-b9e08c17b4d0',
          'c9bb279c-2301-4bef-b664-35f6d3faf734',
          '800c6d5b-6abe-4680-b65f-0165b2ce2eda',
          'b182cc5e-0592-458b-9662-267b4f6f700e',
          '40d85866-7d93-445b-b3c0-d00b9edc4811',
          '719160e9-77cc-4227-9ad8-e868407888ec',
          '8f73f2ec-c819-4f3a-a196-5ad244dd386e',
          '54e25282-66c4-4a8c-b3f5-8e0c5f3b8b82',
          '73797ed8-000c-4ef2-bb88-f862cf50b7c5',
          'a21fa5d8-df0a-4a5f-a913-07becbef9af6',
          '44dba380-8a9c-4705-b55b-50900d7596e5',
          '7805c33e-fe1a-438e-915b-220a6665dae5',
          '5e637ee5-6ed0-4c25-84ad-46368f555658',
          'f2927c59-abae-474e-aa3f-e3533eb79e92',
          '7f879151-6126-42dd-bab9-5e3c748edb15',
          '60878fc3-4a30-4b89-9a1b-4f7da25c525b',
          'bc10b03e-970e-4d6e-88e7-1ba0bd531144',
          '2aa60c4a-4193-43b5-8c55-812c8befe04c',
          '7c18fd04-f237-4bd3-8916-83934d7da293',
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

    if (Number(basicDetail.delivery_qty) !== Number(detail.final_qty)) {
      await orderDB.procurement_order_details.updateMany({
        where: {
          reference_id: detail.supplier_reference_id,
          procurement_orders: {
            client_order_id: detail.order_id,
          },
        },
        data: {
          deliver_qty: basicDetail.delivery_qty,
          customer_receive_qty: basicDetail.delivery_qty,
          final_qty: basicDetail.delivery_qty,
        },
      });
      await procurementDB.supplier_order_details.update({
        where: {
          id: detail.id,
        },
        data: {
          actual_delivery_qty: basicDetail.delivery_qty,
          confirm_delivery_qty: basicDetail.delivery_qty,
          final_qty: basicDetail.delivery_qty,
        },
      });
    }
  }
};

run();
