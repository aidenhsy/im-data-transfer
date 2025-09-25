import { DatabaseService } from '../database';

const run = async () => {
  const database = new DatabaseService();

  const details =
    await database.imProcurementProd.supplier_order_details.findMany({
      where: {
        id: {
          in: [
            '05808a8a-ef5d-487b-830a-f04122d2c14c',
            '1490431a-57dd-4fd2-b352-1e7b03fd06a1',
            '17ca6e26-c810-472a-b7e8-cbeee5161215',
            '1906e05a-b074-4505-9435-91a831660f32',
            '1b87e059-31a8-4b0f-9ee2-eacb657a7a31',
            '24c246d0-24da-4c92-a734-8b2f4450063a',
            '26dc0f99-06e0-44d8-925d-24d1ce8017c2',
            '2779a154-60a5-4bdb-bdc9-79fb7b40e0fa',
            '352f5cab-6475-4ac6-8955-04293ca36ad3',
            '35b8036a-03b4-4360-b1f7-8200e6cfcefd',
            '363729d0-d9ee-47ac-95c4-57062c98f174',
            '3f4c69c9-ab25-4fe7-865d-b2d31b3c9325',
            '630205f7-75f3-44ac-bd7b-ea12a4885442',
            '6c177a4e-7248-42c5-add1-9931e3c170b3',
            '8508d33e-14b2-489c-a97d-ed9de37a69d0',
            '881f8d32-b856-44b6-be3f-00bacf5a39fe',
            '89d2f8b8-e7b9-47e6-9fe7-f34475c6bee4',
            'b2cd197b-3d01-43b7-b66e-0d99bcd2ed01',
            'b8cd83f5-8cb1-4d35-98c5-6dd92f6e2ba6',
            'b9478f5f-c53a-49b0-afa6-9052fd6e1e9a',
            'bb6b0186-8220-4620-8f57-0bfaf62a2c4b',
            'c8941aae-9dc1-4313-906b-e3c45091a048',
            'd116130b-7135-460b-b327-12a42617fec0',
            'e85e2f92-4dfc-4a16-a95c-14273c515567',
            'f07536d1-0587-436a-a8a9-a719ec6f9f12',
            'f34543c2-9546-4156-b068-a376050e431f',
            'f4df8572-e0e9-4983-939a-54135b9ea0a9',
            'f5d177c4-27dc-4ae3-8859-ecc695a80b73',
            'f7c659bf-cf87-494f-8054-707325df747d',
            'fc973015-4bed-4c32-a4be-5a139dbee445',
            'fe09c813-2959-42e5-bf25-c35c6c8023bb',
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
