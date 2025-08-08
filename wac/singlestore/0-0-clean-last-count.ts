import { PrismaClient as ImInventory } from '../../prisma/clients/im-inventory-prod';
import { PrismaClient as ImProd } from '../../prisma/clients/im-prod';

const run = async () => {
  const imInventory = new ImInventory();
  const imProd = new ImProd();

  const countid = 3739;

  const imProdInventory = await imProd.scm_inventory_detail_copy.findMany({
    where: {
      single_id: countid,
    },
  });

  const lastCount = await imInventory.inventory_count.findFirst({
    where: {
      id: countid.toString(),
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
    console.error('No inventory count found with id 3739');
    return;
  }

  await imInventory.inventory_count_details.deleteMany({
    where: {
      inventory_count_id: lastCount.id,
    },
  });

  await imInventory.shop_item_weighted_price.deleteMany({
    where: {
      created_at: '2025-06-30T00:00:00.000000Z',
      shop_id: 104,
      type: 'stock_count',
    },
  });

  for (const item of imProdInventory) {
    const supplierItem = await imInventory.supplier_items.findFirst({
      where: {
        supplier_reference_id: {
          contains: `20250807-${lastCount.scm_shop?.client_tier_id}-${item.goods_id}-${lastCount.scm_shop?.cities?.id}`,
        },
      },
    });

    if (!supplierItem) {
      console.log(`${item.goods_name}, ${item.qty} 未找到`);
      continue;
    }

    await imInventory.inventory_count_details.create({
      data: {
        count_qty: Number(item.qty),
        weighted_price: Number(item.price),
        supplier_item_id: supplierItem.id,
        inventory_count_id: lastCount.id,
        created_at: '2025-06-30T21:00:00.000000Z',
        updated_at: '2025-06-30T21:00:00.000000Z',
      },
    });
  }

  console.log('done');
};

run();
