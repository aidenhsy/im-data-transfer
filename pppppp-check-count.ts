import { DatabaseService } from './database';
import axios from 'axios';

const run = async () => {
  const database = new DatabaseService();

  const shops = await database.imProcurementProd.scm_shop.findMany({
    where: {
      status: 1,
      is_join: 0,
    },
    select: {
      id: true,
    },
    orderBy: {
      id: 'asc',
    },
  });

  for (const shop of shops) {
    const response = await axios.post(
      'https://imms.shaihukeji.com/inventory/count/create',
      {
        shop_id: shop.id,
        type: 1,
      }
    );

    if (response.data.msg !== 'success') {
      // console.log(response.data.data);
      continue;
    }

    const count = await database.imInventoryProd.inventory_count.findUnique({
      where: {
        id: response.data.data.id,
      },
      include: {
        scm_shop: true,
      },
    });

    console.log(count?.id, shop.id);

    const details =
      await database.imInventoryProd.inventory_count_details.findMany({
        where: {
          inventory_count_id: response.data.data.id,
        },
      });

    const uniqueProcurement =
      await database.imProcurementProd.supplier_order_details.findMany({
        where: {
          supplier_orders: {
            shop_id: count?.scm_shop?.id,
            status: 4,
            created_at: {
              gte: new Date('2025-11-01T00:00:00.000Z'),
            },
          },
        },
        distinct: ['supplier_item_id'],
        select: {
          supplier_item_id: true,
        },
      });

    const missingProcurement = uniqueProcurement.filter(
      (item) =>
        !details.some(
          (detail) => detail.supplier_item_id === item.supplier_item_id
        )
    );
    console.log('missingProcurement', missingProcurement);

    for (const detail of details) {
      const lastPurchase =
        await database.imProcurementProd.supplier_items.findFirst({
          where: {
            id: detail.supplier_item_id,
            city_id: count?.scm_shop?.city_id,
            tier_id: count?.scm_shop?.client_tier_id!,
          },
        });

      const lastPrice =
        Number(lastPurchase?.price) /
        Number(lastPurchase?.package_unit_to_base_ratio);

      if (Number(detail.weighted_price) === 0) {
        continue;
      }

      if (lastPrice > 2 * Number(detail.weighted_price)) {
        console.log(
          `⚠️  lastPrice (${lastPrice}) is MORE than double of weighted_price (${detail.weighted_price}) for ${detail.supplier_item_id} on ${count?.scm_shop?.id}`
        );
      } else if (lastPrice < Number(detail.weighted_price) / 2) {
        console.log(
          `⚠️  lastPrice (${lastPrice}) is LESS than half of weighted_price (${detail.weighted_price}) for ${detail.supplier_item_id} on ${count?.scm_shop?.id}`
        );
      }
    }

    const deleteResponse = await axios.post(
      'https://imms.shaihukeji.com/inventory/count/delete',
      {
        count_id: response.data.data.id,
      }
    );

    console.log(deleteResponse.data.data, 'deleted');
  }
};

run();
