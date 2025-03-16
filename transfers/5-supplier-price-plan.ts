import { PrismaClient } from '@prisma/client';

const run = async () => {
  const prisma = new PrismaClient();

  const supplierPricePlan = await prisma.scm_supplier_price_plan.findMany({
    include: {
      scm_supplier: true,
    },
  });

  const length = supplierPricePlan.length;
  let index = 0;
  for (const supplierPrice of supplierPricePlan) {
    console.log(`${index++}/${length}`);

    const supplier = await prisma.supplier.findFirst({
      where: {
        supplier_name: supplierPrice.scm_supplier?.supplier_name,
        supplier_type: 1,
      },
    });
    if (!supplier) {
      console.log(`供应商${supplierPrice.scm_supplier?.supplier_name}不存在`);
      continue;
    }

    await prisma.scm_supplier_price_plan.update({
      where: {
        id: supplierPrice.id,
      },
      data: {
        supplierid: supplier.id,
      },
    });
  }
};

run();
