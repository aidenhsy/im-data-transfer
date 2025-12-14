import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const orders = await database.imProcurementProd.supplier_orders.findMany({
    where: {
      order_date: '2025-12-14',
      type: {
        in: [3, 9],
      },
    },
    include: {
      supplier_order_details: true,
    },
  });

  for (const order of orders) {
    for (const detail of order.supplier_order_details) {
      if (detail.supplier_reference_id?.startsWith('20251213-')) {
        const newReferenceId = detail.supplier_reference_id.replace(
          '20251213-',
          '20251214-'
        );

        const pricing =
          await database.scmPricingProd.scm_good_pricing.findFirst({
            where: {
              external_reference_id: newReferenceId,
            },
          });

        if (!pricing) {
          console.log(newReferenceId, 'no pricing');
          await database.imProcurementProd.supplier_order_details.delete({
            where: { id: detail.id },
          });
          continue;
        }
        await database.imProcurementProd.supplier_order_details.update({
          where: { id: detail.id },
          data: {
            price: Number(pricing.sale_price),
            supplier_reference_id: newReferenceId,
          },
        });
      }
    }
  }
};

run();
