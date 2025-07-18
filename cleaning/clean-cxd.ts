import { PrismaClient as ImProcurementDB } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as ScmPricingDB } from '../prisma/clients/scm-pricing-prod';

const run = async () => {
  const imProcurementDB = new ImProcurementDB();
  const scmPricingDB = new ScmPricingDB();

  const pricings = await scmPricingDB.scm_good_pricing.findMany({
    where: {
      version: '20250718',
    },
    include: {
      scm_goods: true,
      scm_good_units: true,
    },
  });

  for (const pricing of pricings) {
    const existSupplierItem = await imProcurementDB.supplier_items.findFirst({
      where: {
        supplier_reference_id: pricing.external_reference_id,
      },
    });

    if (!existSupplierItem) {
      console.log(pricing.external_reference_id);
      await imProcurementDB.supplier_items.upsert({
        where: {
          supplier_reference_id: pricing.external_reference_id!,
        },
        update: {
          price: pricing.sale_price,
          tier_id: pricing.client_tier_id,
        },
        create: {
          name: pricing.scm_goods.name,
          status: 1,
          letter_name: pricing.scm_goods.letter_name,
          supplier_id: 1,
          photo_url: pricing.scm_goods.photo_url,
          price: pricing.sale_price,
          supplier_reference_id: pricing.external_reference_id!,
          cut_off_time: pricing.cut_off_time,
          package_unit_to_base_ratio: Number(
            pricing.scm_good_units.ratio_to_base
          ),
          package_unit_name: pricing.scm_good_units.name!,
          base_unit_id: pricing.scm_goods.standard_base_unit,
          city_id: pricing.city_id,
          weighing: pricing.scm_goods.weighing,
          tier_id: pricing.client_tier_id,
        },
      });
    }
  }
};

run();
