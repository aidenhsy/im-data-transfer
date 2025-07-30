import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';
import { PrismaClient as Pricing } from './prisma/clients/scm-pricing-prod';

const run = async () => {
  const procurement = new Procurement();
  const order = new Order();
  const pricing = new Pricing();

  const batchSize = 100;
  let skip = 0;
  let totalProcessed = 0;

  // Set to collect distinct missing items
  const missingItems = new Set<string>();

  const total = await procurement.supplier_order_details.count({
    where: {
      supplier_item_id: null,
    },
  });

  while (true) {
    const procurementDetails =
      await procurement.supplier_order_details.findMany({
        orderBy: {
          created_at: 'desc',
        },
        where: {
          supplier_item_id: null,
        },
        take: batchSize,
        skip: skip,
      });

    // If no more records, break the loop
    if (procurementDetails.length === 0) {
      break;
    }

    console.log(`${skip} / ${total}`);

    for (const procurementDetail of procurementDetails) {
      const supplierItem = await procurement.supplier_items.findFirst({
        where: {
          supplier_reference_id: procurementDetail.supplier_reference_id,
        },
      });

      if (supplierItem) {
        await procurement.supplier_order_details.update({
          where: {
            id: procurementDetail.id,
          },
          data: {
            supplier_item_id: supplierItem.id,
          },
        });
        continue;
      }

      const sectionId = procurementDetail.supplier_reference_id
        .split('-')
        .slice(2)
        .join('-');

      const supplierItem2 = await procurement.supplier_items.findFirst({
        where: {
          supplier_reference_id: {
            endsWith: sectionId,
          },
        },
      });

      if (supplierItem2) {
        await procurement.supplier_order_details.update({
          where: {
            id: procurementDetail.id,
          },
          data: {
            supplier_item_id: supplierItem2.id,
          },
        });
        continue;
      }

      // Add to missing items set (automatically handles duplicates)
      missingItems.add(sectionId);
    }

    totalProcessed += procurementDetails.length;
    skip += batchSize;

    // If we got fewer records than the batch size, we've reached the end
    if (procurementDetails.length < batchSize) {
      break;
    }
  }

  console.log(`Total records processed: ${totalProcessed}`);
  console.log(`\nDistinct missing items (${missingItems.size}):`);

  // Convert Set to Array and sort for better readability
  const sortedMissingItems = Array.from(missingItems).sort();
  sortedMissingItems.forEach((item) => {
    console.log(item);
  });
};

run();
