import { PrismaClient as IMProcurement } from '../prisma/clients/im-procurement-prod';

const run = async () => {
  const imProcurement = new IMProcurement();

  const data = await imProcurement.plan_item_supplier_good.findMany({
    where: {
      shop_id: 134,
    },
  });

  for (const item of data) {
    const supplierItem = await imProcurement.supplier_items.findFirst({
      where: {
        id: item.supplier_item_id!,
      },
    });

    if (supplierItem?.supplier_reference_id) {
      // Change index 3 to 19 and slice off the rest, then join by '-'
      const parts = supplierItem.supplier_reference_id!.split('-');
      parts[3] = '19';
      const newReferenceId = parts.slice(0, 4).join('-');
      const newSupplierItem = await imProcurement.supplier_items.findFirst({
        where: {
          supplier_reference_id: {
            startsWith: newReferenceId,
          },
        },
      });

      await imProcurement.plan_item_supplier_good.create({
        data: {
          shop_id: 139,
          supplier_item_id: newSupplierItem?.id,
          plan_item_id: item.plan_item_id,
        },
      });
    }
  }
};

run();
