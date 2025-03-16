import { PrismaClient } from '@prisma/client';

const run = async () => {
  const prisma = new PrismaClient();

  const goodDailyTransfers = await prisma.scm_suppliers_goods_daily.findMany({
    include: {
      scm_supplier: true,
    },
  });

  const length = goodDailyTransfers.length;
  let index = 0;
  for (const goodDailyTransfer of goodDailyTransfers) {
    console.log(`${index++}/${length}`);

    const supplier = await prisma.supplier.findFirst({
      where: {
        supplier_name: goodDailyTransfer.scm_supplier?.supplier_name,
        supplier_type: 1,
      },
    });
    if (!supplier) {
      console.log(
        `供应商${goodDailyTransfer.scm_supplier?.supplier_name}不存在`
      );
      continue;
    }

    await prisma.scm_suppliers_goods_daily.update({
      where: {
        id: goodDailyTransfer.id,
      },
      data: {
        supplier_id: supplier.id,
      },
    });
  }
};
