import { PrismaClient as ScmDB } from '../prisma/clients/scm-prod';
import { PrismaClient as ImProcurementDB } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as ScmOrderDB } from '../prisma/clients/scm-order-prod';
import { PrismaClient as ScmPricingDB } from '../prisma/clients/scm-pricing-prod';

const run = async () => {
  const scmOrderDB = new ScmOrderDB();
  const imProcurementDB = new ImProcurementDB();
  const scmPricingDB = new ScmPricingDB();

  const orderDetails = await imProcurementDB.supplier_order_details.findMany();

  const length = orderDetails.length;
  let count = 0;

  for (const detail of orderDetails) {
    count++;
    if (count % 10000 === 0) {
      console.log(`${count}/${length}`);
    }

    const matchedPricings = await scmPricingDB.scm_good_pricing.findFirst({
      where: {
        external_reference_id: detail.supplier_reference_id,
      },
    });

    if (!matchedPricings) {
      console.log(detail.supplier_reference_id, 'no pricing');
      continue;
    }

    if (Number(matchedPricings.sale_price) !== Number(detail.price)) {
      console.log(detail.supplier_reference_id, 'pricing mismatch');
      continue;
    }
    const scmOrderDetail = await scmOrderDB.procurement_order_details.findFirst(
      {
        where: {
          procurement_orders: {
            client_order_id: detail.order_id,
          },
          reference_id: detail.supplier_reference_id,
        },
      }
    );

    if (!scmOrderDetail) {
      console.log(detail.supplier_reference_id, 'no order detail');
      continue;
    }

    if (Number(scmOrderDetail.price) !== Number(detail.price)) {
      console.log(
        detail.supplier_reference_id,
        'order detail pricing mismatch'
      );
      continue;
    }
  }
};

run();
