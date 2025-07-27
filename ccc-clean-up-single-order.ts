import { PrismaClient as Procurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from './prisma/clients/scm-prod';
import { PrismaClient as Order } from './prisma/clients/scm-order-prod';

const run = async () => {
  const procurement = new Procurement();
  const basic = new Basic();
  const order = new Order();

  const basicDetails = await basic.scm_order_details.findMany({
    where: {
      order_id: 36516,
    },
  });

  for (const detail of basicDetails) {
    const endsWith = detail.reference_id!.split('-').slice(1).join('-');
    const procurementDetail =
      await procurement.supplier_order_details.findFirst({
        where: {
          supplier_reference_id: {
            endsWith: endsWith,
          },
          order_id: {
            in: [
              '04ad443c-7864-4501-b2ab-81b8aab1ae91',
              'a4213430-7594-407f-941c-1b31c7eaab94',
            ],
          },
        },
      });
    if (!procurementDetail) {
      console.log(detail.reference_id);
      continue;
    }
    await basic.scm_order_details.update({
      where: {
        id: detail.id,
      },
      data: {
        reference_id: procurementDetail.supplier_reference_id,
        reference_order_id: procurementDetail.order_id,
      },
    });
    await procurement.supplier_order_details.update({
      where: {
        id: procurementDetail.id,
      },
      data: {
        actual_delivery_qty: Number(detail.deliver_goods_qty),
      },
    });
  }
};

run();
