import { PrismaClient } from '@prisma/client';

const run = async () => {
  const prisma = new PrismaClient();
  const orderStocks = await prisma.scm_order_stock.findMany({
    include: {
      scm_seller: true,
    },
  });

  const totalLength = orderStocks.length;
  let index = 0;
  for (const orderStock of orderStocks) {
    console.log(`${index++}/${totalLength}`);
    const supplier = await prisma.supplier.findFirst({
      where: {
        supplier_name: orderStock.scm_seller?.seller_name,
        supplier_type: 2,
      },
    });
    if (!supplier) {
      console.log(`供应商${orderStock.scm_seller?.seller_name}不存在`);
      continue;
    }
    await prisma.scm_order_stock.update({
      where: {
        id: orderStock.id,
      },
      data: {
        supplier_id: supplier.id,
      },
    });
  }

  process.exit(0);
};

run();
