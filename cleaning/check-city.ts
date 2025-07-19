import { PrismaClient as ScmDB } from '../prisma/clients/scm-prod';
import { PrismaClient as ImProcurementDB } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrderDB } from '../prisma/clients/scm-order-prod';
import { PrismaClient as ScmPricingDB } from '../prisma/clients/scm-pricing-prod';

const run = async () => {
  const scmOrderDB = new ScmOrderDB();
  const imProcurementDB = new ImProcurementDB();
  const scmPricingDB = new ScmPricingDB();

  const supplyPlanGoods = await imProcurementDB.supply_plan_items.findMany({
    where: {
      supply_plan_id: 83,
    },
    include: {
      generic_items: true,
    },
  });

  for (const item of supplyPlanGoods) {
    const supplierGood = await imProcurementDB.supplier_items.findFirst({
      where: {
        supplier_reference_id: {
          startsWith: `20250718-2-${item.item_id}-19`,
        },
      },
    });

    if (supplierGood) {
      await imProcurementDB.plan_item_supplier_good.create({
        data: {
          plan_item_id: item.id,
          supplier_item_id: supplierGood.id,
          shop_id: 139,
        },
      });
    }
  }
  console.log('done');
  process.exit(0);
};

run();
