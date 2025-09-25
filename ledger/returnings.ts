import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const details =
    await database.imProcurementProd.supplier_order_details.findMany({
      where: {
        id: {
          in: [
            '012091ef-7eea-48ba-ad22-3bd96bd0ad28',
            '0438b236-7d7b-4e44-a777-f22f7b9059f9',
            '04a0bd53-155e-445a-9864-f93ee08d849c',
            '06970f32-b09f-47fe-8612-d9391831a9ea',
            '07d7d44a-c6d3-4826-827b-b36461826a59',
            '087723e3-7d18-4866-9dc9-2cec50c0e6b0',
            '09ba6fa3-dc9a-476c-b1a5-9f8122433143',
            '0b3a1c36-758e-4155-8f7b-19b785d1bd96',
            '0c95b975-42bc-46af-b353-73935ab060e2',
            '0d04fae6-673e-43f4-8e1d-3bdd5693c515',
            '0d7301b1-27d3-4f71-bc5e-35e976529232',
            '0d98e319-ed84-4fb4-9946-21c6b7efdfbb',
            '0e8f0bc4-35b9-4ee5-bdc7-e977b6311a67',
            '0f70abd7-ae24-4c01-a8eb-f8d47df74dc4',
            '106f6718-4432-4054-ba74-603085be01dd',
            '109da99b-512d-4f23-8702-7eac47304b68',
            '1364747d-327f-40c1-9eb2-bda8c009f8eb',
            '1ac7cba5-cbed-41a7-8762-9b4e0452210c',
            '1ae27ad3-141f-4f89-85d0-1869eb5b42ca',
            '1b90a65c-5ef8-42d6-80f5-e0bbacb5bd45',
            '1b9fd868-43c2-4402-ac85-339c47ae3f35',
            '1ca28792-dea5-4549-8d4f-c069390c9c1e',
            '1dbfb2cb-ba16-4828-95a5-beef8a7c32ea',
            '1e3c59bf-2661-41d9-9401-3af146a717bc',
            '1fef2115-5480-4919-94e9-1bf93ec7836d',
            '2176bd9c-1478-4689-904b-0df126207607',
            '2374a856-5f44-41af-94c0-0ce854d6018b',
            '23b8b011-8388-4ee9-8c56-e18aee909180',
            '24e5ebac-4f30-450f-9ff7-4a3c6281d386',
            '265adce9-de47-4525-bdb4-8477b1b7a28f',
            '2741b7fa-55cd-443e-b21f-ab26f505028b',
            '2900829a-9ea8-4195-a5a7-c71dcbf08bbb',
            '2bf6dbfb-c647-4247-800d-a7180cace275',
            '2f08b709-5498-4b2e-a816-c33a941063ad',
            '31025daa-05e0-4453-af15-3a057e8a99af',
            '337ff5f9-3d65-4435-a513-8b1823219f12',
            '3436cdea-98b7-4af1-a787-bec47ae19657',
            '3639dade-7b05-4dce-a81f-0168ca3b9056',
            '3907c9d7-d579-4437-b6a6-f9c6a824721d',
            '3b2c72b2-56b9-420c-837c-09d86ee49902',
            '3d9df29d-8572-492b-bdc5-6d8414a0f109',
            '3f9fa45d-e96d-4d76-9ef1-41219d398989',
            '40cc0aff-ab11-4d08-9fa6-9265207a1862',
            '40fd0b7f-ea0d-4eb2-9e7e-f7318eb09caa',
            '4124ce71-1ef9-4861-9b0a-82265077b399',
            '421eb7e2-c598-4093-95ca-8e921ed8c099',
            '42b6f635-1564-4f4c-9146-be53e342fc3d',
            '43d56cb3-a6e4-4c84-b509-67d0cb56ca62',
            '4447cf7e-0cba-4952-8f28-66872badc917',
            '4463db89-c44e-4de8-b712-bf9b608eee34',
            '44b7f935-f464-4ffe-afb2-30c678dd6751',
            '455246df-5b13-480d-9a31-4675cfa949c5',
            '45980878-4c71-4e50-9340-a1c3c6ab5715',
            '46c63f64-c847-4499-82b1-1954369d68b5',
            '470c163d-d3d9-4e5a-a56e-64b5240f0c28',
            '4759cc86-9bc7-4893-b166-41128d06d2d4',
            '480741a5-c269-40a1-8ea8-25362a63758e',
            '483fdb9e-72d0-4465-b07c-16d47a10b451',
            '49122d1f-b223-4c50-b3e9-83dcb6d95c7f',
            '4a02289e-7cbd-4241-9965-67563f147122',
            '4a14a575-f27e-42ec-9ba7-3bee2b3ef3d9',
            '4b37603a-a175-49c4-b5bd-24509b4b9715',
            '4b935627-71b7-4167-af85-9fe38b45f9eb',
            '4ce260e7-fe8b-47f5-bb3d-f1b5d2d26d54',
            '4e5b792e-e8ef-40f0-977d-a29be80db29c',
            '4f1a8c27-5b50-4ae5-bdb9-f3342cbb37c6',
            '5031dfd1-2af9-4eee-86a1-d70afcdb327f',
            '5097972c-f6f4-4b3a-8e3e-995ef1f275b1',
            '525dc202-e87a-4787-b92e-011703b738a9',
            '529e22f4-7770-4092-bc20-3cb8ce21d22c',
            '558cd27d-094e-40b4-b0ea-5b3b0ada68a4',
            '56285ee1-21d2-49a9-b61c-d5b062ccd01d',
            '56bdcba6-25da-4bc1-ad82-cf4b02a3e06a',
            '58b5c307-aab5-41f9-bf13-f1c32f60c5a0',
            '58ecb539-7ae2-4357-94e4-c938698bdeac',
            '59446a3b-b882-4809-89ed-667bc6b991f0',
            '5b16ccf6-9bd2-4704-9b94-772223a17965',
            '5c686933-c04f-48bb-ad56-d80ded03a449',
            '5dc3ae0c-9dcc-4fb1-b18a-0d9808225e82',
            '5fbc7cf0-9ae8-4291-9c97-7aed99e34faa',
            '60938148-c62b-4578-8451-b368e0271769',
            '612110bf-37c6-4e91-a898-754f87255d84',
            '61648438-3f6c-4948-b01d-0bc2026300e9',
            '61a19915-2986-4591-bed1-570365fd2811',
            '629dbdd6-99d5-4f5a-9a16-cf40f073c2fc',
            '641b3c26-f436-419c-9143-c5c02411c7f4',
            '64c66b1a-d82d-4749-9f44-abeac00822ea',
            '65d3fa7b-dd60-4207-8d57-342e7ec8936f',
            '66133d22-0790-439c-8d1d-d9f3b15080f0',
            '66624468-2dae-4ecd-aa5e-1bcdbb37ea5c',
            '66fd8adc-533b-4e13-b118-61e791627bff',
            '67cdd56e-876d-427b-923d-f5aeaeea3215',
            '6851870a-ae5f-4a51-ac9b-804c05543dc2',
            '6875b7b3-24f0-4dd3-a314-7a705e701c78',
            '691f634e-55f9-4e0b-a4f8-23520e93fc8e',
            '6a16b6eb-7fa6-4946-a455-55f5b3ddffb9',
            '6a69d461-5e9b-409d-a252-93be900196e7',
            '6c383f51-2a37-4cbb-84f9-29243b6e35c6',
            '6c389f24-08a2-4f0e-8498-2551bc63f53a',
            '6e386ac1-9555-469c-98ec-63b42d90d0e7',
            '6e9812b9-5563-42e0-83d8-726d2bb671f0',
            '6eb24370-773f-4ef0-9514-82c0eb43a7dc',
            '6eb74817-5b31-468c-8ef1-bb8147bf1122',
            '6ffb5927-8382-4bf4-bbd3-8714590e8044',
            '7015b894-186f-4e19-99d4-49e15cb54916',
            '73463a13-a1af-4988-83a2-2c91e4986bdc',
            '73e02a1b-4f66-4a81-9f4a-5b7d253d6019',
            '742fa051-b405-4520-8d7d-63ea7305b464',
            '7641b0a7-c220-4507-909e-0b498790044e',
          ],
        },
      },
      include: {
        supplier_orders: true,
      },
    });

  for (const detail of details) {
    const returnQty =
      Number(detail.actual_delivery_qty) - Number(detail.final_qty);

    if (returnQty > 0) {
      const existReturn =
        await database.imProcurementProd.supplier_order_return_details.findFirst(
          {
            where: {
              source_detail_id: detail.id,
            },
          }
        );
      if (existReturn) {
        console.log('found');
        const scmReturn =
          await database.scmOrderProd.procurement_order_return_details.findFirst(
            {
              where: {
                procurement_order_details: {
                  reference_id: detail.supplier_reference_id,
                },
                procurement_order_returns: {
                  client_return_id: existReturn.return_id,
                },
              },
            }
          );
        if (scmReturn) {
          await database.imProcurementProd.supplier_order_return_details.update(
            {
              where: {
                id: existReturn.id,
              },
              data: {
                qty_returned: returnQty,
              },
            }
          );
          await database.scmOrderProd.procurement_order_return_details.update({
            where: {
              id: scmReturn.id,
            },
            data: {
              qty_returned: returnQty,
            },
          });
        }
      } else {
        const newReturn =
          await database.imProcurementProd.supplier_order_returns.create({
            data: {
              supplier_id: 1,
              shop_id: detail.supplier_orders.shop_id,
              original_order_id: detail.order_id,
              status: 1,
              note: '补退货',
              return_reason_id: 1,
            },
          });
        await database.imProcurementProd.supplier_order_return_details.create({
          data: {
            return_id: newReturn.id,
            supplier_item_id: detail.supplier_item_id!,
            source_detail_id: detail.id,
            qty_returned: returnQty,
            unit_price: detail.price,
          },
        });
        const scmOrder =
          await database.scmOrderProd.procurement_orders.findFirst({
            where: {
              client_order_id: detail.order_id,
            },
            include: {
              procurement_order_details: true,
            },
          });
        const newScmReturn =
          await database.scmOrderProd.procurement_order_returns.create({
            data: {
              client_id: 1,
              shop_id: detail.supplier_orders.shop_id,
              original_order_id: scmOrder?.id!,
              status: 1,
              note: '补退货',
              client_return_id: newReturn.id,
              return_reason_id: 1,
            },
          });
        const scmOrderDetail = scmOrder?.procurement_order_details.find(
          (item) => item.reference_id === detail.supplier_reference_id
        );
        await database.scmOrderProd.procurement_order_return_details.create({
          data: {
            return_id: newScmReturn.id,
            good_id: scmOrderDetail?.good_id!,
            good_name: scmOrderDetail?.name!,
            source_detail_id: scmOrderDetail?.id!,
            qty_returned: returnQty,
            unit_price: detail.price,
          },
        });
      }
    }
  }
};

run();
