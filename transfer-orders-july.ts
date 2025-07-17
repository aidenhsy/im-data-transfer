import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const run = async () => {
  const scmProdDB = new Scm();
  const scmPiceDB = new ScmPricing();
  const imProcurementDB = new IMProcurement();
  const scmOrderDB = new ScmOrder();

  const orders = await scmProdDB.scm_order.findMany({
    where: {
      delivery_day_info_id: {
        in: [
          '2025-07-01',
          '2025-07-02',
          '2025-07-03',
          '2025-07-04',
          '2025-07-05',
          '2025-07-06',
          '2025-07-07',
          '2025-07-08',
          '2025-07-09',
          '2025-07-10',
          '2025-07-11',
          '2025-07-12',
          '2025-07-13',
          '2025-07-14',
        ],
      },
    },
    include: {
      scm_order_details: {
        include: {
          scm_goods: {
            select: {
              name: true,
              photo_url: true,
              order_good_unit_id: true,
              scm_good_units_scm_goods_order_good_unit_idToscm_good_units: {
                select: {
                  name: true,
                  ratio_to_base: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const length = orders.length;
  let count = 0;

  for (const order of orders) {
    count++;
    if (count % 100 === 0) {
      console.log(`${count}/${length}`);
    }
    const shop = await imProcurementDB.scm_shop.findFirst({
      where: {
        id: Number(order.shop_id),
      },
    });
    // const orderAmount = order.scm_order_details
    //   .reduce((acc, item) => {
    //     return acc + Number(item.price) * Number(item.delivery_qty);
    //   }, 0)
    //   .toFixed(2);
    // const procurementOrder = await imProcurementDB.supplier_orders.create({
    //   data: {
    //     shop_id: Number(order.shop_id),
    //     supplier_id: 1,
    //     irregular_items: 0,
    //     status: 1,
    //     order_date: dayjs(order.create_time).utc().format('YYYY-MM-DD'),
    //     delivery_date: dayjs(order.create_time)
    //       .utc()
    //       .add(1, 'day')
    //       .format('YYYY-MM-DD'),
    //     type: 3,
    //     order_amount: Number(orderAmount),
    //   },
    // });
    // const orderServiceOrder = await scmOrderDB.procurement_orders.create({
    //   data: {
    //     shop_id: Number(order.shop_id),
    //     client_id: 1,
    //     status: 2,
    //     type: 3,
    //     order_date: dayjs(order.create_time).utc().format('YYYY-MM-DD'),
    //     delivery_date: dayjs(order.create_time)
    //       .utc()
    //       .add(1, 'day')
    //       .format('YYYY-MM-DD'),
    //     client_order_id: procurementOrder.id,
    //     order_amount: Number(orderAmount),
    //   },
    // });
    for (const item of order.scm_order_details) {
      const orderDateVersion = dayjs(order.create_time)
        .utc()
        .format('YYYYMMDD');
      const pricing = await scmPiceDB.scm_good_pricing.findFirst({
        where: {
          external_reference_id: `${orderDateVersion}-${shop?.client_tier_id}-${item.goods_id}-${shop?.city_id}-${item.scm_goods?.order_good_unit_id}`,
        },
      });
      if (!pricing) {
        console.log(
          'no pricing',
          `${orderDateVersion}-${shop?.client_tier_id}-${item.goods_id}-${shop?.city_id}-${item.scm_goods?.order_good_unit_id}`
        );
        continue;
      }
      // await imProcurementDB.supplier_order_details.create({
      //   data: {
      //     item_id: item.goods_id!,
      //     price: Number(pricing.sale_price),
      //     order_qty: Number(item.delivery_qty),
      //     supplier_reference_id: pricing.external_reference_id!,
      //     cut_off_time: '15:00:00',
      //     package_unit_name:
      //       item.scm_goods
      //         ?.scm_good_units_scm_goods_order_good_unit_idToscm_good_units
      //         ?.name!,
      //     package_unit_to_base_ratio: Number(
      //       item.scm_goods
      //         ?.scm_good_units_scm_goods_order_good_unit_idToscm_good_units
      //         ?.ratio_to_base
      //     ),
      //     order_id: procurementOrder.id,
      //     supplier_item_name: item.scm_goods?.name!,
      //     supplier_item_photo: item.scm_goods?.photo_url!,
      //   },
      // });

      // await scmOrderDB.procurement_order_details.create({
      //   data: {
      //     name: item.scm_goods?.name!,
      //     reference_id: pricing.external_reference_id!,
      //     order_qty: Number(item.delivery_qty),
      //     price: Number(pricing.sale_price),
      //     cut_off_time: '15:00:00',
      //     order_id: orderServiceOrder.id,
      //     good_id: item.goods_id!,
      //     unit_id: item.scm_goods?.order_good_unit_id!,
      //     pricing_id: pricing.id,
      //   },
      // });

      // await scmProdDB.scm_order_details.update({
      //   where: {
      //     id: item.id,
      //   },
      //   data: {
      //     reference_order_id: procurementOrder.id,
      //     reference_id: pricing.external_reference_id!,
      //   },
      // });
    }
  }
};

run();
