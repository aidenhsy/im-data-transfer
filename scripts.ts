import { PrismaClient as SCMClient } from './prisma/clients/scm';
import { PrismaClient as IMClient } from './prisma/clients/im';

const run = async () => {
  const scmClient = new SCMClient();
  const imClient = new IMClient();

  const goods = await scmClient.scm_good_pricing.findMany({
    where: {
      version: '20250528',
      client_tier_id: 2,
      scm_goods: {
        status: 1,
      },
    },
    take: 10,
    include: {
      scm_good_units: true,
      scm_goods: {
        include: {
          scm_good_units_scm_goods_base_good_unit_idToscm_good_units: true,
          scm_stock: true,
        },
      },
    },
  });

  for (const good of goods) {
    if (
      good.scm_goods.scm_good_units_scm_goods_base_good_unit_idToscm_good_units
        ?.name === '克' ||
      '毫升' ||
      '个'
    ) {
      const unitName =
        good.scm_goods
          .scm_good_units_scm_goods_base_good_unit_idToscm_good_units?.name;

      let baseUnitId = 1;
      if (unitName === '克') {
        baseUnitId = 1;
      } else if (unitName === '毫升') {
        baseUnitId = 6;
      } else if (unitName === '个') {
        baseUnitId = 8;
      }

      await imClient.supplier_items.create({
        data: {
          name: good.scm_goods.name,
          supplier_reference_id: good.external_reference_id,
          letter_name: good.scm_goods.letter_name,
          supplier_id: 1,
          status: good.scm_goods.status,
          package_unit_name: good.scm_good_units.name,
          photo_url: good.scm_goods.photo_url,
          package_unit_to_base_ratio: Number(good.scm_good_units.ratio_to_base),
          price: good.sale_price,
          cut_off_time: good.scm_goods.scm_stock?.sold_time?.toString(),
          base_unit_id: baseUnitId,
        },
      });
    }
  }
};

run();
