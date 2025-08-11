import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';

const run = async () => {
  const procurement = new Procurement();

  const fromShop = 111;
  const toShop = 142;

  const planSupplierItems = await procurement.plan_item_supplier_good.findMany({
    where: {
      shop_id: fromShop,
    },
  });

  for (const planSupplierItem of planSupplierItems) {
    await procurement.plan_item_supplier_good.create({
      data: {
        shop_id: toShop,
        plan_item_id: planSupplierItem.plan_item_id,
        supplier_item_id: planSupplierItem.supplier_item_id,
      },
    });
  }
  console.log('done');
  process.exit(0);
};

run();
