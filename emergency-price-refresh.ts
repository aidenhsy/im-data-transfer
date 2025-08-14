import { PrismaClient as Order } from './prisma/clients/scm-order-prod';
import { PrismaClient as Pricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const orderDB = new Order();
  const pricingDB = new Pricing();

  const details = await orderDB.procurement_order_details.findMany({
    where: {
      procurement_orders: {
        type: 3,
        created_at: {
          gt: new Date('2025-08-14T15:00:00.000Z'),
        },
      },
    },
  });

  for (const detail of details) {
    const pricing = await pricingDB.scm_good_pricing.findFirst({
      where: {
        external_reference_id: detail.reference_id,
      },
    });

    if (!pricing) {
      console.log('no pricing', detail.reference_id);
      continue;
    }

    if (Number(pricing.sale_price) !== Number(detail.price)) {
      await orderDB.procurement_order_details.update({
        where: {
          id: detail.id,
        },
        data: {
          price: pricing.sale_price,
        },
      });
      console.log('updated', detail.reference_id);
      continue;
    }
  }
};

run();
