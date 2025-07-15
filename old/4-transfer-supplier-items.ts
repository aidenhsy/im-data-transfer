import { PrismaClient as IMProd } from '../prisma/clients/im-prod';
import { PrismaClient as SCMProd } from '../prisma/clients/scm-prod';
import { PrismaClient as SCMPricingProd } from '../prisma/clients/scm-pricing-prod';
import { PrismaClient as ImProcurementProd } from '../prisma/clients/im-procurement-prod';

const run = async () => {
  const im = new IMProd();
  const scm = new SCMProd();
  const scmPricing = new SCMPricingProd();
  const imProcurement = new ImProcurementProd();
  const VERSION = '20250708';

  const shops = await imProcurement.scm_shop.findMany({
    where: {
      status: 1,
    },
    select: {
      id: true,
      shop_name: true,
      is_join: true,
      city_id: true,
      scm_shop_brand: {
        select: {
          supply_plan_id: true,
        },
      },
    },
  });

  for (const shop of shops) {
    const supplyItems = await imProcurement.supply_plan_items.findMany({
      where: {
        supply_plan_id: shop.scm_shop_brand.supply_plan_id,
      },
    });
    const tierId = shop.is_join === 1 ? 3 : 2;
    console.log(`${shop.shop_name} has ${supplyItems.length} supply items`);
    let notFoundCount = 0;

    for (const supplyItem of supplyItems) {
      const supplierItem = await imProcurement.supplier_items.findFirst({
        where: {
          supplier_reference_id: {
            startsWith: `${VERSION}-${tierId}-${supplyItem.item_id}-${shop.city_id}`,
          },
        },
      });
      if (!supplierItem) {
        notFoundCount++;
        continue;
      }
      await imProcurement.plan_item_supplier_good.create({
        data: {
          shop_id: shop.id,
          plan_item_id: supplyItem.id,
          supplier_item_id: supplierItem.id,
        },
      });
    }

    console.log(
      `${shop.shop_name} has ${notFoundCount} not found supplier items`
    );
  }
};

run();
