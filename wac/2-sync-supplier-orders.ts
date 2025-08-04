import { PrismaClient as ImInventory } from '../prisma/clients/im-inventory-prod';
import { PrismaClient as ImProcurement } from '../prisma/clients/im-procurement-prod';

const run = async () => {
  const imInventory = new ImInventory();
  const imProcurement = new ImProcurement();

  const orders = await imInventory.supplier_orders.findMany({
    where: {},
  });
};

run();
