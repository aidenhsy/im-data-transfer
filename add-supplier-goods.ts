import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';

const run = async () => {
  const imProcurement = new IMProcurement();

  const shops = await imProcurement.scm_shop.findMany({
    where: {
      status: 1,
    },
    include: {
      scm_shop_brand: true,
    },
  });

  for (const shop of shops) {
    console.log(shop.shop_name);
    const supplyPlanGoods = await imProcurement.supply_plan_items.findMany({
      where: {
        supply_plan_id: shop.scm_shop_brand.supply_plan_id,
      },
    });

    for (const supplyPlanGood of supplyPlanGoods) {
      const supplierGood = await imProcurement.supplier_items.findFirst({
        where: {
          supplier_reference_id: {
            startsWith: `20250720-${shop.client_tier_id}-${supplyPlanGood.item_id}-${shop.city_id}`,
          },
        },
      });
      if (supplierGood) {
        await imProcurement.plan_item_supplier_good.create({
          data: {
            supplier_item_id: supplierGood.id,
            plan_item_id: supplyPlanGood.id,
            shop_id: shop.id,
          },
        });
      }
    }
  }
};

run();
