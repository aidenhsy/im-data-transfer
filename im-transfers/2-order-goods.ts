// translate goodid into supplygood id
import { PrismaClient } from '@prisma/client';

const run = async () => {
  const prisma = new PrismaClient();

  const orderdetails = await prisma.scm_order_details.findMany({
    include: {
      scm_order: true,
    },
    where: {
      scm_order: {
        delivery_time: {
          gte: new Date('2025-03-01'),
        },
      },
    },
  });

  const length = orderdetails.length;
  let index = 0;

  for (const orderdetail of orderdetails) {
    console.log(`${index++}/${length}`);
    const shop = await prisma.scm_shop.findFirst({
      where: {
        id: orderdetail.scm_order?.shop_id,
      },
    });

    const spg = await prisma.scm_supply_plan_scm_goods.findFirst({
      where: {
        supply_plan_id: shop?.supply_plan_id,
        good_id: orderdetail.goods_id,
      },
    });
    if (!spg) {
      await prisma.scm_order_details.delete({
        where: {
          id: orderdetail.id,
        },
      });
      continue;
    }
    await prisma.scm_order_details.update({
      where: {
        id: orderdetail.id,
      },
      data: {
        spg_id: spg?.id,
      },
    });
  }
};

run();
