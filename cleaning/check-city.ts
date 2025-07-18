import { PrismaClient as ScmDB } from '../prisma/clients/scm-prod';
import { PrismaClient as ImProcurementDB } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrderDB } from '../prisma/clients/scm-order-prod';
import { PrismaClient as ScmPricingDB } from '../prisma/clients/scm-pricing-prod';

const run = async () => {
  const scmOrderDB = new ScmOrderDB();
  const imProcurementDB = new ImProcurementDB();
  const scmPricingDB = new ScmPricingDB();

  const planSupplierItems =
    await imProcurementDB.plan_item_supplier_good.findMany({
      select: {
        shop_id: true,
        supplier_items: {
          select: {
            supplier_reference_id: true,
          },
        },
      },
    });

  for (const item of planSupplierItems) {
    const shop = await scmPricingDB.scm_shop.findFirst({
      where: {
        id: Number(item.shop_id),
      },
    });

    // Just console log 3 got from supplier_reference_id
    const supplierReferenceId = item.supplier_items?.supplier_reference_id;
    if (supplierReferenceId) {
      const parts = supplierReferenceId.split('-');
      console.log(parts[3]);
      if (Number(parts[3]) !== Number(shop?.city_id)) {
        console.log(
          item.supplier_items?.supplier_reference_id,
          shop?.city_id,
          'city mismatch'
        );
      }
    }
  }
};

run();
