import { PrismaClient as IMProd } from './prisma/clients/im-prod';
import { PrismaClient as SCMProd } from './prisma/clients/scm-prod';
import { PrismaClient as SCMPricing } from './prisma/clients/scm-pricing';
import { PrismaClient as ImProcurement } from './prisma/clients/im-procurement';

const run = async () => {
  const im = new IMProd();
  const scm = new SCMProd();
  const scmPricing = new SCMPricing();
  const imProcurement = new ImProcurement();
  const VERSION = '20250627';

  const shops = await imProcurement.scm_shop.findMany({
    where: {
      status: 1,
    },
    select: {
      id: true,
      shop_name: true,
      is_join: true,
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
            startsWith: `${VERSION}-${tierId}-${supplyItem.item_id}`,
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
