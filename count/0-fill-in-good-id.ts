import { PrismaClient as ImProd } from '../prisma/clients/im-prod';

const run = async () => {
  const imProd = new ImProd();

  const details = await imProd.scm_inventory_detail_copy.findMany({
    where: {
      goods_id: null,
    },
  });

  let id = 9999900;
  for (const detail of details) {
    const otherDetailSameName =
      await imProd.scm_inventory_detail_copy.findFirst({
        where: {
          goods_name: detail.goods_name,
        },
      });

    if (otherDetailSameName) {
      await imProd.scm_inventory_detail_copy.update({
        where: {
          id: detail.id,
        },
        data: {
          goods_id: otherDetailSameName.goods_id,
        },
      });
    } else {
      await imProd.scm_inventory_detail_copy.update({
        where: {
          id: detail.id,
        },
        data: {
          goods_id: id++,
        },
      });
    }
  }
};
