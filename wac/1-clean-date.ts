import { PrismaClient as ImInventory } from '../prisma/clients/im-inventory-prod';
import { PrismaClient as ImProd } from '../prisma/clients/im-prod';
import { PrismaClient as ImProcurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as ScmPricing } from '../prisma/clients/scm-pricing-prod';

const run = async () => {
  const imInventory = new ImInventory();
  const imProd = new ImProd();
  const imProcurement = new ImProcurement();
  const scmPricing = new ScmPricing();

  const counts = await imInventory.inventory_count.findMany({
    where: {
      created_at: {
        gt: new Date('2025-07-30'),
      },
    },
  });

  for (const count of counts) {
    await imInventory.inventory_count.update({
      where: {
        id: count.id,
      },
      data: {
        created_at: new Date('2025-07-31T21:00:00.000Z'),
      },
    });
  }
};

run();
