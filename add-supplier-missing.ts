import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';
import { PrismaClient as Pricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const procurement = new Procurement();
  const order = new Order();
  const pricing = new Pricing();

  const missingItems = await procurement.supplier_order_details.findMany({
    where: {
      supplier_item_id: null,
    },
  });

  for (const item of missingItems) {
    const sectionId = item.supplier_reference_id.split('-').slice(2).join('-');

    const pricingItem = await pricing.scm_good_pricing.findFirst({
      where: {
        external_reference_id: {
          endsWith: sectionId,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!pricingItem) {
      console.log(item.supplier_reference_id, 'not found!');
      continue;
    }
  }
};

run();
