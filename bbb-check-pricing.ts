import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const details =
    await database.imProcurementProd.supplier_order_details.findMany({
      select: {
        id: true,
        price: true,
        supplier_reference_id: true,
        order_id: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

  console.log(details.length);

  for (const detail of details) {
    const pricing = await database.scmPricingProd.scm_good_pricing.findFirst({
      where: {
        external_reference_id: detail.supplier_reference_id,
      },
      select: {
        sale_price: true,
      },
    });
    const orderDetail =
      await database.scmOrderProd.procurement_order_details.findFirst({
        where: {
          reference_id: detail.supplier_reference_id,
          procurement_orders: {
            client_order_id: detail.order_id,
          },
        },
        select: {
          id: true,
          price: true,
        },
      });
    if (Number(pricing?.sale_price) !== Number(detail.price)) {
      console.log(
        detail.supplier_reference_id,
        'pricing mismatch',
        'pricing price:',
        pricing?.sale_price,
        'detail price:',
        detail.price,
        'order detail price:',
        orderDetail?.price
      );
    }
    if (Number(orderDetail?.price) !== Number(detail.price)) {
      console.log(
        detail.supplier_reference_id,
        'order detail mismatch',
        'pricing price:',
        pricing?.sale_price,
        'order detail price:',
        orderDetail?.price,
        'detail price:',
        detail.price
      );

      // await database.imProcurementProd.supplier_order_details.update({
      //   where: {
      //     id: detail.id,
      //   },
      //   data: {
      //     price: Number(pricing?.sale_price),
      //   },
      // });
      await database.scmOrderProd.procurement_order_details.update({
        where: {
          id: orderDetail?.id,
        },
        data: {
          price: Number(pricing?.sale_price),
        },
      });
    }
  }
};

run();
