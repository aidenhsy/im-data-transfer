import { PrismaClient } from '@prisma/client';

const run = async () => {
  const prisma = new PrismaClient();

  const storeHouseUsers = await prisma.scm_storehouse_scm_shop.findMany({
    include: {
      scm_storehouse: true,
    },
  });

  for (const storeHouseUser of storeHouseUsers) {
    const user = await prisma.users.findFirst({
      where: {
        mobile: storeHouseUser.scm_storehouse.mobile,
      },
    });
    if (!user) {
      console.log(`${storeHouseUser.scm_storehouse.mobile} 不存在`);
      continue;
    }
    await prisma.picker_client_shop.upsert({
      where: {
        user_id_shop_id: {
          user_id: user.id,
          shop_id: storeHouseUser.shop_id,
        },
      },
      update: {
        user_id: user.id,
      },
      create: {
        user_id: user.id,
        shop_id: storeHouseUser.shop_id,
      },
    });
  }
  process.exit(0);
};

run();
