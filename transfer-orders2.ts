import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as IMProcurementDev } from './prisma/clients/im-procurement-dev';
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

  const orders = await scmProdDB.scm_order.findMany({
    where: {
      order_no: {
        in: [
          '134_20250706150228_1',
          '122_20250712150232_1',
          '100_20250712150232_1',
          '117_20250712150232_1',
          '135_20250714153432_1',
          '129_20250714153430_1',
          '138_20250704150232_1',
          '138_20250705150229_1',
          '138_20250706150228_1',
          '138_20250707150222_1',
          '105_20250715152256_1',
        ],
      },
    },
    include: {
      scm_order_details: {
        include: {
          scm_goods: {
            select: {
              name: true,
              order_good_unit_id: true,
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
        const version = dayjs(item.create_time).utc().format('YYYYMMDD');
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
