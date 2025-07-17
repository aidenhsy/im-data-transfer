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
    console.log(`${count}/${length}`);
    const shop = await imProcurementDB.scm_shop.findFirst({
      where: {
        id: Number(order.shop_id),
      },
    });

    for (const item of order.scm_order_details) {
      const version = dayjs(order.create_time).utc().format('YYYYMMDD');

      const pricing = await scmPiceDB.scm_good_pricing.findFirst({
        where: {
          goods_id: Number(item.goods_id),
          good_unit_id: item.scm_goods?.order_good_unit_id!,
          client_tier_id: shop?.client_tier_id!,
          city_id: shop?.city_id!,
        },
      });

      if (!pricing) {
        const markup =
          ((Number(item.price) - Number(item.hide_price)) /
            Number(item.hide_price)) *
          100;
        await scmPiceDB.scm_good_pricing.upsert({
          where: {
            goods_id_good_unit_id_client_tier_id_version_city_id_is_active: {
              goods_id: Number(item.goods_id),
              good_unit_id: item.scm_goods?.order_good_unit_id!,
              client_tier_id: shop?.client_tier_id!,
              version,
              city_id: shop?.city_id!,
              is_active: true,
            },
          },
          update: {},
          create: {
            goods_id: Number(item.goods_id),
            good_unit_id: item.scm_goods?.order_good_unit_id!,
            client_tier_id: shop?.client_tier_id!,
            city_id: shop?.city_id!,
            pricing_strategy: 'margin',
            profit_margin: markup,
            sale_price: item.price,
            weighted_average_cost: Number(item.hide_price),
            is_active: true,
            created_at: dayjs(item.create_time).utc().toDate(),
            locked_after: dayjs(item.create_time)
              .utc()
              .hour(3)
              .minute(30)
              .second(0)
              .millisecond(0)
              .toDate(),
            version,
            cut_off_time: '15:00:00',
          },
        });
      } else {
        const version = dayjs(item.create_time).utc().format('YYYYMMDD');
        await scmPiceDB.scm_good_pricing.upsert({
          where: {
            goods_id_good_unit_id_client_tier_id_version_city_id_is_active: {
              goods_id: Number(item.goods_id),
              good_unit_id: item.scm_goods?.order_good_unit_id!,
              client_tier_id: shop?.client_tier_id!,
              city_id: shop?.city_id!,
              version,
              is_active: true,
            },
          },
          update: {},
          create: {
            goods_id: Number(item.goods_id),
            good_unit_id: item.scm_goods?.order_good_unit_id!,
            client_tier_id: shop?.client_tier_id!,
            city_id: shop?.city_id!,
            pricing_strategy: 'margin',
            weighted_average_cost: Number(item.hide_price),
            profit_margin: pricing.profit_margin,
            sale_price: item.price,
            is_active: true,
            created_at: dayjs(item.create_time).utc().toDate(),
            locked_after: dayjs(item.create_time)
              .utc()
              .hour(3)
              .minute(30)
              .second(0)
              .millisecond(0)
              .toDate(),
            version,
            cut_off_time: '15:00:00',
          },
        });
      }
    }
  }
};

run();
