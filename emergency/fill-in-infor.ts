import { PrismaClient as Procurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as Order } from '../prisma/clients/scm-order-prod';
import { PrismaClient as Pricing } from '../prisma/clients/scm-pricing-prod';

const run = async () => {
  const orderDB = new Order();
  const pricing = new Pricing();

  const orders = await orderDB.procurement_order_details.findMany({
    where: {
      pricing_id: null,
    },
  });

  for (const order of orders) {
    const scmPricing = await pricing.scm_good_pricing.findFirst({
      where: {
        external_reference_id: order.reference_id,
      },
    });

    if (!scmPricing) {
      console.log(`not found: ${order.reference_id}`);
      continue;
    }

    const referece_id = scmPricing.external_reference_id;
    const good_id = scmPricing.goods_id;
    const unit_id = scmPricing.good_unit_id;
    await orderDB.procurement_order_details.update({
      where: {
        id: order.id,
      },
      data: {
        pricing_id: scmPricing.id,
        reference_id: referece_id,
        good_id: good_id,
        unit_id: unit_id,
      },
    });
  }
};

run();
