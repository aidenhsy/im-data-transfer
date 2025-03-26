import { PrismaClient } from '@prisma/client';

const run = async () => {
  const prisma = new PrismaClient();
  const supplyGoods = await prisma.scm_supply_plan_scm_goods.findMany();
  const count = supplyGoods.length;
  let index = 1;

  for (const supplyGood of supplyGoods) {
    console.log(`${index++}/${count}`);
    const existGoodPrice = await prisma.scm_good_pricing.findFirst({
      where: {
        goods_id: supplyGood.good_price_id!,
        client_tier_id: 2,
        good_unit_id: supplyGood.order_unit_id!,
      },
    });

    if (!existGoodPrice) {
      // First delete any dependent records in scm_good_units
      await prisma.scm_good_units.deleteMany({
        where: {
          supply_plan_goods_id: supplyGood.id,
        },
      });

      // Then delete the supply good
      await prisma.scm_supply_plan_scm_goods.delete({
        where: {
          id: supplyGood.id,
        },
      });
      continue;
    }

    await prisma.scm_supply_plan_scm_goods.update({
      where: {
        id: supplyGood.id,
      },
      data: {
        good_price_id: existGoodPrice.id,
      },
    });
  }
};

run();
