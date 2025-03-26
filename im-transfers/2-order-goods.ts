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

  for (const orderdetail of orderdetails) {
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
    }
    console.log(
      spg?.id,
      orderdetail.id,
      orderdetail.scm_order?.delivery_day_info_id
    );
  }
};

run();
