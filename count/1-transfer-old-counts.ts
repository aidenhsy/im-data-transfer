import { PrismaClient as ImInventory } from '../prisma/clients/im-inventory-prod';
import { PrismaClient as ImProd } from '../prisma/clients/im-prod';
import { PrismaClient as ImProcurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as ScmPricing } from '../prisma/clients/scm-pricing-prod';

const run = async () => {
  const imInventory = new ImInventory();
  const imProd = new ImProd();
  const imProcurement = new ImProcurement();
  const scmPricing = new ScmPricing();

  // await imInventory.shop_item_weighted_price.deleteMany();
  // await imInventory.inventory_count_details.deleteMany();
  // await imInventory.inventory_count.deleteMany();
  const oldCounts = await imProd.scm_inventory_single_copy.findMany({
    where: {
      end_date: new Date('2025-06-30'),
    },
    include: {
      scm_inventory_detail_copy: true,
    },
  });

  let missingItems = new Set();
  console.log(oldCounts.length);

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
    const tier_id = shop.client_tier_id!;

    // const newCount = await imInventory.inventory_count.create({
    //   data: {
    //     id: oldCount.id.toString(),
    //     shop_id: oldCount.shop_id,
    //     type: 1,
    //     status: 1,
    //     count_amount: oldCount.last_amount,
    //     finished_at: oldCount.end_date!,
    //     created_at: oldCount.end_date!,
    //     updated_at: oldCount.end_date!,
    //   },
    // });

    for (const detail of oldCount.scm_inventory_detail_copy) {
      const good_id = detail.goods_id;
      // First, check if we need to create a supplier item
      const scmGood = await scmPricing.scm_goods.findFirst({
        where: {
          id: Number(good_id),
        },
        include: {
          scm_good_units_scm_goods_order_good_unit_idToscm_good_units: true,
        },
      });

      // Determine the supplier_reference_id format
      const supplier_reference_id = scmGood
        ? `20250731-${tier_id}-${good_id}-${city_id}-${scmGood?.order_good_unit_id}`
        : `20250731-${tier_id}-${good_id}-${city_id}`;

      // Check if supplier item already exists with the exact reference ID
      const supplier_item = await imInventory.supplier_items.findFirst({
        where: {
          supplier_reference_id: supplier_reference_id,
        },
      });

      if (!supplier_item) {
        missingItems.add(good_id);

        if (!scmGood) {
          await imProcurement.supplier_items.create({
            data: {
              name: detail.goods_name!,
              status: 0,
              letter_name: null,
              supplier_id: 1,
              photo_url: null,
              price: Number(detail.price),
              supplier_reference_id: supplier_reference_id,
              cut_off_time: '14:00:00',
              base_unit_id: 1,
              package_unit_name: null,
              package_unit_to_base_ratio: 1,
              city_id: city_id,
              weighing: 1,
              tier_id: tier_id,
            },
          });
          continue;
        }

        await imProcurement.supplier_items.create({
          data: {
            name: scmGood.name!,
            status: 0,
            letter_name: scmGood.letter_name!,
            supplier_id: 1,
            photo_url: scmGood.photo_url!,
            price: Number(detail.price),
            supplier_reference_id: supplier_reference_id,
            cut_off_time: '14:00:00',
            base_unit_id: scmGood?.standard_base_unit,
            package_unit_name:
              scmGood
                ?.scm_good_units_scm_goods_order_good_unit_idToscm_good_units
                ?.name,
            package_unit_to_base_ratio: Number(
              scmGood
                ?.scm_good_units_scm_goods_order_good_unit_idToscm_good_units
                ?.ratio_to_base
            ),
            city_id: city_id,
            weighing: 1,
            tier_id: tier_id,
          },
        });
        continue;
      }

      // await imInventory.inventory_count_details.create({
      //   data: {
      //     id: detail.id.toString(),
      //     hypo_qty: null,
      //     count_qty: detail.qty,
      //     weighted_price: Number(detail.price),
      //     supplier_item_id: supplier_item.id,
      //     inventory_count_id: newCount.id,
      //     updated_at: oldCount.end_date!,
      //     created_at: oldCount.end_date!,
      //   },
      // });

      // await imInventory.shop_item_weighted_price.create({
      //   data: {
      //     shop_id: Number(shop.id),
      //     supplier_item_id: supplier_item.id,
      //     weighted_price: Number(detail.price),
      //     total_qty: Number(detail.qty),
      //     total_value: Number(detail.price) * Number(detail.qty),
      //     type: 'stock_count',
      //     updated_at: oldCount.end_date!,
      //     created_at: oldCount.end_date!,
      //   },
      // });
    }
  }

  console.log(`\nDistinct missing items (${missingItems.size}):`);
};

run();
