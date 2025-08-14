import { PrismaClient as Order } from './prisma/clients/scm-order-prod';
import { PrismaClient as Pricing } from './prisma/clients/scm-pricing-prod';
import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';

const run = async () => {
  const orderDB = new Order();
  const pricingDB = new Pricing();
  const procurementDB = new Procurement();

  const details = await procurementDB.supplier_order_details.findMany({
    where: {
      supplier_orders: {
        type: 9,
        created_at: {
          gt: new Date('2025-08-14T21:00:00.000Z'),
        },
      },
    },
  });

  for (const detail of details) {
    const pricing = await pricingDB.scm_good_pricing.findFirst({
      where: {
        external_reference_id: detail.supplier_reference_id,
      },
    });

    if (!pricing) {
      console.log('no pricing', detail.supplier_reference_id);
      continue;
    }

    if (Number(pricing.sale_price) !== Number(detail.price)) {
      await procurementDB.supplier_order_details.update({
        where: {
          id: detail.id,
        },
        data: {
          price: Number(pricing.sale_price),
        },
      });
      console.log('updated', detail.supplier_reference_id);
      continue;
    }
  }
  console.log('done');
  process.exit(0);
};

run();
