import { PrismaClient as ImInventory } from '../prisma/clients/im-inventory-prod';
import { PrismaClient as ImProd } from '../prisma/clients/im-prod';

const run = async () => {
  const imInventory = new ImInventory();
  const imProd = new ImProd();

  const oldCounts = await imProd.scm_inventory_single.findMany({
    where: {
      end_date: new Date('2025-05-31'),
    },
    include: {
      scm_inventory_detail: true,
    },
  });

  for (const oldCount of oldCounts) {
    const shop = await imInventory.scm_shop.findFirst({
      where: {
        id: Number(oldCount.shop_id),
      },
    });
    if (!shop) {
      console.log(`shop not found: ${oldCount.shop_id}`);
      continue;
    }

    const city_id = shop.city_id;
    const shop_id = oldCount.shop_id;
    const tier_id = shop.client_tier_id;

    const newCount = await imInventory.inventory_count.create({
      data: {
        id: oldCount.id.toString(),
        shop_id: oldCount.shop_id,
        status: 1,
        count_amount: oldCount.last_amount,
        finished_at: oldCount.create_time,
        created_at: oldCount.create_time!,
        updated_at: oldCount.create_time!,
      },
    });

    for (const detail of oldCount.scm_inventory_detail) {
      const good_id = detail.goods_id;
      const supplier_item = await imInventory.supplier_items.findFirst({
        where: {
          supplier_reference_id: {
            startsWith: `20250727-${tier_id}-${good_id}-${city_id}`,
          },
        },
      });
      if (!supplier_item) {
        console.log(`supplier_item not found: ${detail.goods_id}`);
        continue;
      }

      await imInventory.inventory_count_details.create({
        data: {
          id: detail.id.toString(),
          hypo_qty: null,
          count_qty: detail.qty,
          weighted_price: Number(detail.price),
          supplier_item_id: supplier_item.id,
          inventory_count_id: newCount.id,
        },
      });

      await imInventory.shop_item_weighted_price.create({
        data: {
          shop_id: Number(shop_id),
          supplier_item_id: supplier_item.id,
          weighted_price: Number(detail.price),
          total_qty: Number(detail.qty),
          total_value: Number(detail.price) * Number(detail.qty),
          type: 'stock_count',
        },
      });
    }
  }
};

run();
