import { PrismaClient } from './prisma/clients/im';

const run = async () => {
  const prisma = new PrismaClient();
  const sgItems = await prisma.scm_supply_plan_scm_goods.findMany({
    select: {
      id: true,
      goods_id: true,
      scm_supply_plan: {
        select: {
          scm_shop: {
            select: {
              brand_id: true,
            },
          },
        },
      },
    },
  });

  for (const item of sgItems) {
    const uniqueBrandIds = new Set<number>();

    if (item.scm_supply_plan && item.scm_supply_plan.scm_shop) {
      for (const shop of item.scm_supply_plan.scm_shop) {
        if (shop.brand_id !== undefined) {
          uniqueBrandIds.add(shop.brand_id);
        }
      }
    }

    const uniqueBrandIdsArray = Array.from(uniqueBrandIds);

    for (const brandId of uniqueBrandIdsArray) {
      try {
        // First, check if the record already exists
        const existingRecord = await prisma.brand_goods.findFirst({
          where: {
            brand_id: brandId,
            goods_id: item.goods_id,
          },
        });

        if (!existingRecord) {
          // Create only if it doesn't exist
          await prisma.brand_goods.create({
            data: {
              brand_id: brandId,
              goods_id: item.goods_id,
            },
          });
          console.log(
            `Created brand_goods for goods_id ${item.goods_id} and brand_id ${brandId}`
          );
        } else {
          console.log(
            `Skipped existing record for goods_id ${item.goods_id} and brand_id ${brandId}`
          );
        }
      } catch (error) {
        console.error(
          `Error processing goods_id ${item.goods_id} and brand_id ${brandId}:`,
          error
        );
      }
    }
  }
};

run();
