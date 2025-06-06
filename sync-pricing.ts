import { PrismaClient as IMProcurementClient } from './prisma/clients/im-procurement';
import { PrismaClient as SCMPricingClient } from './prisma/clients/scm-pricing';

const run = async () => {
  const imProcurement = new IMProcurementClient();
  const scmPricing = new SCMPricingClient();

  const client_id = 1;

  const client = await scmPricing.client_organizations.findFirst({
    where: {
      id: Number(client_id),
    },
  });

  const currentVersion = await scmPricing.pricing_versions
    .findMany({
      orderBy: {
        created_at: 'desc',
      },
      take: 2,
    })
    .then((versions) => versions[0] || null);

  const privateGoods = await scmPricing.private_client_goods.findMany({
    where: {
      client_organization_id: Number(client_id),
    },
  });

  const pricings = await scmPricing.scm_good_pricing.findMany({
    where: {
      version: currentVersion?.id,
      client_tier_id: client?.tier_id,
      scm_goods: {
        OR: [
          {
            is_public: true,
          },
          {
            id: {
              in: privateGoods.map((item) => item.goods_id),
            },
          },
        ],
      },
    },
    include: {
      scm_goods: true,
      scm_good_units: true,
    },
  });
  const remap = pricings.map((item) => ({
    supplier_reference_id: item.external_reference_id,
    name: item.scm_goods.name,
    status: item.is_active && item.scm_goods.status === 1 ? 1 : 0,
    letter_name: item.scm_goods.letter_name,
    photo_url: item.scm_goods.photo_url,
    price: item.sale_price,
    standard_unit_id: item.scm_goods.standard_base_unit_id,
    city_id: item.city_id,
    cut_off_time: item.cut_off_time,
    package_unit_name: item.scm_good_units.name,
    package_unit_to_base_ratio: item.scm_good_units.ratio_to_base,
  }));

  for (const item of remap) {
    await imProcurement.supplier_items.create({
      data: {
        name: item.name,
        status: item.status,
        letter_name: item.letter_name,
        supplier_id: 1,
        photo_url: item.photo_url,
        price: item.price,
        supplier_reference_id: item.supplier_reference_id,
        cut_off_time: item.cut_off_time,
        package_unit_to_base_ratio: Number(item.package_unit_to_base_ratio),
        package_unit_name: item.package_unit_name,
        base_unit_id: item.standard_unit_id,
        city_id: item.city_id,
      },
    });
  }
};

run();
