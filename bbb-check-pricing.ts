import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const details =
    await database.imProcurementProd.supplier_order_details.findMany({
      select: {
        price: true,
        supplier_reference_id: true,
        supplier_orders: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

  console.log(details.length);

  for (const detail of details) {
    const pricing = await database.scmPricingProd.scm_good_pricing.findFirst({
      where: {
        external_reference_id: detail.supplier_reference_id,
      },
    });
    if (Number(pricing?.sale_price) !== Number(detail.price)) {
      console.log(detail.supplier_reference_id, 'pricing mismatch');
      continue;
    }
  }
};

run();
