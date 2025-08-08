import { PrismaClient as ImInventory } from './prisma/clients/im-inventory-prod';
import { PrismaClient as ImProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';

const run = async () => {
  const imInventory = new ImInventory();
  const imProcurement = new ImProcurement();
  const scm = new Scm();

  const supplierItems = await imProcurement.supplier_items.findMany();

  for (const item of supplierItems) {
    const goodId = Number(item.supplier_reference_id?.split('-')[2]);
    if (!goodId) {
      console.log(item.supplier_reference_id, 'goodId is null');
      continue;
    }
    const prodGood = await scm.scm_goods.findFirst({
      where: {
        id: goodId,
      },
      include: {
        scm_goods_category: true,
      },
    });
    if (!prodGood) {
      console.log(item.supplier_reference_id);
      continue;
    }
    await imProcurement.supplier_items.update({
      where: {
        id: item.id,
      },
      data: {
        category_name: prodGood.scm_goods_category.name,
      },
    });
    await imInventory.supplier_items.update({
      where: {
        id: item.id,
      },
      data: {
        category_name: prodGood.scm_goods_category.name,
      },
    });
  }
  console.log('done');
  process.exit(0);
};

run();
