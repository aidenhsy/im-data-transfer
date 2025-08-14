import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from './prisma/clients/scm-prod';
import { PrismaClient as Pricing } from './prisma/clients/scm-pricing-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';

const run = async () => {
  const procurementDB = new Procurement();
  const basicDB = new Basic();
  const pricingDB = new Pricing();
  const orderDB = new Order();

  const shops = await procurementDB.scm_shop.findMany({
    select: {
      id: true,
      shop_name: true,
      client_tier_id: true,
      city_id: true,
    },
  });
  const shopMap = new Map(shops.map((shop) => [shop.id, shop]));

  const orders = await basicDB.scm_order.findMany({
    where: {
      receival_time: {
        gt: new Date('2025-06-01T00:00:00.000Z'),
        lt: new Date('2025-06-30T23:59:59.999Z'),
      },
      status: 3,
    },
    take: 10,
    include: {
      scm_order_details: {
        include: {
          scm_goods: {
            include: {
              scm_good_units_scm_goods_order_good_unit_idToscm_good_units: true,
              scm_goods_category: true,
            },
          },
        },
      },
    },
  });

  const length = orders.length;
  console.log(`Total orders: ${length}`);

  for (const order of orders) {
    const { scm_order_details, ...rest } = order;

    const shop = shopMap.get(order.shop_id);

    const order_date = new Date(order.create_time!).toISOString().split('T')[0];
    const delivery_date = new Date(order_date);
    delivery_date.setDate(delivery_date.getDate() + 1);
    const delivery_date_string = delivery_date.toISOString().split('T')[0];

    const order_amount = scm_order_details.reduce(
      (acc, detail) => acc + Number(detail.delivery_qty) * Number(detail.price),
      0
    );
    const actual_amount = scm_order_details.reduce(
      (acc, detail) => acc + Number(detail.num) * Number(detail.price),
      0
    );

    // procurementDB creation
    await procurementDB.supplier_orders.create({
      data: {
        id: order.id.toString(),
        shop_id: Number(shop?.id),
        supplier_id: 1,
        irregular_items: 0,
        status: 4,
        order_date: order_date,
        delivery_date: delivery_date_string,
        type: 9,
        created_at: order.create_time!,
        delivery_time: order.delivery_time,
        order_amount: order_amount,
        actual_amount: actual_amount,
        receive_time: order.receival_time,
        sent_time: order.delivery_time,
        estimated_delivery_time: order.delivery_time,
      },
    });

    // orderDB creation
    await orderDB.procurement_orders.create({
      data: {
        id: order.id.toString(),
        shop_id: Number(shop?.id),
        client_id: 1,
        status: 4,
        type: 9,
        order_date: order_date,
        delivery_date: delivery_date_string,
        created_at: order.create_time!,
        client_order_id: order.id.toString(),
        delivery_time: order.delivery_time,
        order_amount: order_amount,
        actual_amount: actual_amount,
        customer_receive_time: order.receival_time,
        sent_time: order.delivery_time,
        estimated_delivery_time: order.delivery_time,
      },
    });

    for (const detail of scm_order_details) {
      const date_string = order.create_time?.toISOString().split('T')[0];
      const version = order.create_time
        ?.toISOString()
        .slice(0, 10)
        .replace(/-/g, '');
      const good_unit_id = detail.scm_goods?.order_good_unit_id;
      const client_tier_id = shop?.client_tier_id;
      const pricing_strategy = 'margin';
      const profit_margin =
        ((Number(detail.price) - Number(detail.hide_price)) /
          Number(detail.hide_price)) *
        100;
      const sale_price = Number(detail.price);
      const is_active = true;
      const locked_after = `${date_string}T03:30:00.000000Z`;
      const created_at = new Date(
        new Date(locked_after).getTime() - 24 * 60 * 60 * 1000
      );
      const city_id = shop?.city_id;
      const cut_off_time = '13:00:00';
      const weighted_average_price = detail.hide_price;

      const reference_id = `${version}-${shop?.client_tier_id}-${detail.scm_goods?.id}-${shop?.city_id}-${detail.scm_goods?.order_good_unit_id}`;

      if (
        !version ||
        !good_unit_id ||
        !client_tier_id ||
        !city_id ||
        !weighted_average_price
      ) {
        console.log('Missing required fields:', {
          version,
          good_unit_id,
          client_tier_id,
          city_id,
          weighted_average_price,
          order_id: order.id,
          detail_id: detail.id,
        });
        continue;
      }

      let supplierItemId = '';
      const supplierItem = await procurementDB.supplier_items.findFirst({
        where: {
          supplier_reference_id: `20250814-${client_tier_id}-${detail.scm_goods?.id}-${city_id}-${good_unit_id}`,
        },
      });
      if (!supplierItem) {
        const newSupplierItem = await procurementDB.supplier_items.create({
          data: {
            name: detail.scm_goods?.name!,
            status: 0,
            letter_name: detail.scm_goods?.letter_name!,
            supplier_id: 1,
            photo_url: detail.scm_goods?.photo_url!,
            cut_off_time: '15:00:00',
            package_unit_to_base_ratio: Number(
              detail.scm_goods
                ?.scm_good_units_scm_goods_order_good_unit_idToscm_good_units
                ?.ratio_to_base
            ),
            package_unit_name:
              detail.scm_goods
                ?.scm_good_units_scm_goods_order_good_unit_idToscm_good_units
                ?.name!,
            base_unit_id: detail.scm_goods?.standard_base_unit,
            city_id: city_id,
            weighing: detail.scm_goods?.weighing,
            tier_id: client_tier_id,
            supplier_reference_id: `20250814-${client_tier_id}-${detail.scm_goods?.id}-${city_id}-${good_unit_id}`,
            category_name: detail.scm_goods?.scm_goods_category?.name!,
          },
        });
        supplierItemId = newSupplierItem.id;
      } else {
        supplierItemId = supplierItem.id;
      }

      // procurementOrderDetails creation
      await procurementDB.supplier_order_details.create({
        data: {
          id: detail.id.toString(),
          item_id: Number(detail.scm_goods?.id),
          price: Number(detail.price),
          order_qty: Number(detail.num),
          actual_delivery_qty: Number(detail.delivery_qty),
          supplier_reference_id: reference_id,
          cut_off_time: '13:00:00',
          package_unit_name:
            detail.scm_goods
              ?.scm_good_units_scm_goods_order_good_unit_idToscm_good_units
              ?.name!,
          package_unit_to_base_ratio: Number(
            detail.scm_goods
              ?.scm_good_units_scm_goods_order_good_unit_idToscm_good_units
              ?.ratio_to_base
          ),
          supplier_item_name: detail.scm_goods?.name!,
          supplier_item_photo: detail.scm_goods?.photo_url!,
          confirm_delivery_qty: Number(detail.delivery_qty),
          final_qty: Number(detail.delivery_qty),
          supplier_item_id: supplierItemId,
          order_id: order.id.toString(),
        },
      });

      // pricing creation
      let pricingId = '';
      const pricing = await pricingDB.scm_good_pricing.findFirst({
        where: {
          external_reference_id: reference_id,
        },
      });
      if (!pricing) {
        const newPricing = await pricingDB.scm_good_pricing.create({
          data: {
            goods_id: Number(detail.scm_goods?.id),
            good_unit_id: good_unit_id,
            client_tier_id: client_tier_id,
            pricing_strategy: pricing_strategy,
            profit_margin: profit_margin,
            sale_price: sale_price,
            is_active: is_active,
            created_at: created_at,
            locked_after: locked_after,
            version: version,
            city_id: city_id,
            cut_off_time: cut_off_time,
            weighted_average_cost: weighted_average_price,
          },
        });
        pricingId = newPricing.id;
      } else {
        pricingId = pricing.id;
      }

      // orderDB creation
      await orderDB.procurement_order_details.create({
        data: {
          id: detail.id.toString(),
          name: detail.scm_goods?.name!,
          reference_id: reference_id,
          order_qty: Number(detail.num),
          price: Number(detail.price),
          cut_off_time: '13:00:00',
          order_id: order.id.toString(),
          deliver_qty: Number(detail.delivery_qty),
          customer_receive_qty: Number(detail.delivery_qty),
          good_id: Number(detail.scm_goods?.id),
          unit_id: good_unit_id,
          pricing_id: pricingId,
          weighted_average_cost: Number(detail.hide_price),
          final_qty: Number(detail.delivery_qty),
        },
      });

      await basicDB.scm_order_details.update({
        where: {
          id: detail.id,
        },
        data: {
          reference_id: reference_id,
          reference_order_id: order.id.toString(),
        },
      });
    }
  }
  console.log('done');
  process.exit(0);
};

run();
