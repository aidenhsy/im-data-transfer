import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';
import { PrismaClient as Pricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const procurement = new Procurement();
  const order = new Order();
  const pricing = new Pricing();

  const batchSize = 100;
  let skip = 0;
  let hasMoreOrders = true;

  while (hasMoreOrders) {
    const orderDetails = await order.procurement_order_details.findMany({
      skip,
      take: batchSize,
    });

    if (orderDetails.length < batchSize) {
      hasMoreOrders = false;
    }

    if (orderDetails.length === 0) {
      break;
    }

    for (const detail of orderDetails) {
      const goodPricing = await pricing.scm_good_pricing.findFirst({
        where: {
          external_reference_id: detail.reference_id,
        },
      });

      if (!goodPricing) {
        console.log(detail.reference_id);
        continue;
      }

      await order.procurement_order_details.update({
        where: {
          id: detail.id,
        },
        data: {
          weighted_average_cost: goodPricing.weighted_average_cost,
        },
      });
    }

    skip += batchSize;
  }
};

run();
