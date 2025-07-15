import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as IMProcurementDev } from './prisma/clients/im-procurement-dev';
import { PrismaClient as ScmOrder } from './prisma/clients/scm-order-prod';

const run = async () => {
  const imProcurementDev = new IMProcurementDev();
  const imProcurementProd = new IMProcurement();
  const scmOrderProd = new ScmOrder();

  const oldRecords = await imProcurementDev.old_records.findMany();

  const length = oldRecords.length;
  let num = 0;

  for (const record of oldRecords) {
    num++;
    console.log(`${num}/${length}`);
    const shop = await imProcurementProd.scm_shop.findFirst({
      where: {
        shop_name: record.store_name!,
      },
    });

    if (!shop) {
      console.log(`Shop ${record.store_name} not found`);
      continue;
    }

    await imProcurementDev.old_records.update({
      where: {
        id: record.id,
      },
      data: {
        shop_id: shop.id.toString(),
      },
    });
  }
};

run();
