import { PrismaClient as ImInventory } from '../../prisma/clients/im-inventory-prod';
import { PrismaClient as ImProd } from '../../prisma/clients/im-prod';
import tempCount from './temp-count.json';

const run = async () => {
  const imInventory = new ImInventory();
  const imProd = new ImProd();

  for (const shop of tempCount) {
    if (!shop.count_1) {
      continue;
    }
    const countid = shop.count_1;
    const shopid = Number(shop.shop_id);

    const imProdInventory = await imProd.scm_inventory_detail_copy.findMany({
      where: {
        single_id: Number(countid),
      },
    });

    const lastCount = await imInventory.inventory_count.findFirst({
      where: {
        id: countid!.toString(),
      },
      include: {
        scm_shop: {
          include: {
            cities: true,
          },
        },
      },
    });

    if (!lastCount || imProdInventory.length === 0) {
      console.error(`No inventory count found with id ${countid}`);
      return;
    }

    await imInventory.inventory_count_details.deleteMany({
      where: {
        inventory_count_id: lastCount.id,
      },
    });

    await imInventory.shop_item_weighted_price.deleteMany({
      where: {
        source_id: lastCount.id,
      },
    });

    for (const item of imProdInventory) {
      let supplierItemId: string;
      const supplierItem = await imInventory.supplier_items.findFirst({
        where: {
          supplier_reference_id: {
            contains: `20250809-${lastCount.scm_shop?.client_tier_id}-${item.goods_id}-${lastCount.scm_shop?.cities?.id}`,
          },
        },
      });

      if (supplierItem) {
        supplierItemId = supplierItem.id;
      } else {
        const supplierItem = await imInventory.supplier_items.findFirst({
          where: {
            name: {
              contains: item.goods_name!,
            },
            AND: [
              {
                supplier_reference_id: {
                  contains: `20250809-${lastCount.scm_shop?.client_tier_id}-`,
                },
              },
              {
                supplier_reference_id: {
                  contains: `-${lastCount.scm_shop?.city_id}-`,
                },
              },
            ],
          },
        });
        if (!supplierItem) {
          console.error(
            `${item.goods_name}, ${item.qty} 未找到, ${item.id}\n20250809-${lastCount.scm_shop?.client_tier_id}-  -${lastCount.scm_shop?.cities?.id}`
          );
        } else {
          supplierItemId = supplierItem.id;
        }
        continue;
      }

      await imInventory.shop_item_weighted_price.create({
        data: {
          shop_id: shopid,
          supplier_item_id: supplierItemId,
          weighted_price: Number(item.price),
          total_qty: Number(item.inventory_qty),
          total_value: Number(item.price) * Number(item.inventory_qty),
          source_id: lastCount.id,
          source_detail_id: item.id.toString(),
          type: 'stock_count',
          created_at: '2025-06-30T21:00:00.000000Z',
          updated_at: '2025-06-30T21:00:00.000000Z',
        },
      });

      await imInventory.inventory_count_details.create({
        data: {
          count_qty: Number(item.inventory_qty),
          weighted_price: Number(item.price),
          supplier_item_id: supplierItemId,
          inventory_count_id: lastCount.id,
          created_at: '2025-06-30T21:00:00.000000Z',
          updated_at: '2025-06-30T21:00:00.000000Z',
        },
      });
    }
  }

  console.log('done');
};

run();
