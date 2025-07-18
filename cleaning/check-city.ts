import { PrismaClient as ScmDB } from '../prisma/clients/scm-prod';
import { PrismaClient as ImProcurementDB } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrderDB } from '../prisma/clients/scm-order-prod';
import { PrismaClient as ScmPricingDB } from '../prisma/clients/scm-pricing-prod';

const run = async () => {
  const scmOrderDB = new ScmOrderDB();
  const imProcurementDB = new ImProcurementDB();
  const scmPricingDB = new ScmPricingDB();

  const orderDetails = await imProcurementDB.supplier_order_details.findMany({
    select: {
      supplier_reference_id: true,
      supplier_orders: {
        select: {
          shop_id: true,
        },
      },
    },
  });

  const length = orderDetails.length;
  let count = 0;

  for (const detail of orderDetails) {
    count++;
    if (count % 10000 === 0) {
      console.log(`${count}/${length}`);
    }

    const shop = await scmPricingDB.scm_shop.findFirst({
      where: {
        id: detail.supplier_orders.shop_id,
      },
    });

    const matchedPricings = await scmPricingDB.scm_good_pricing.findFirst({
      where: {
        external_reference_id: detail.supplier_reference_id,
      },
    });
    if (matchedPricings?.city_id !== shop?.city_id) {
      console.log(detail.supplier_reference_id, 'city mismatch');
      continue;
    }
  }
};

run();
