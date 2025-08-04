import { PrismaClient as Procurement } from '../prisma/clients/im-procurement-prod';
import { PrismaClient as Basic } from '../prisma/clients/scm-prod';
import { PrismaClient as Order } from '../prisma/clients/scm-order-prod';

const run = async () => {
  const procurement = new Procurement();
  const basic = new Basic();
  const order = new Order();

  const items = await procurement.supplier_order_details.findMany({
    where: {
      order_id: '698c760d-005e-415a-aa58-1f44d8007da7',
    },
  });

  const orderId = await order.procurement_orders.findFirst({
    where: {
      client_order_id: '698c760d-005e-415a-aa58-1f44d8007da7',
    },
  });

  for (const item of items) {
    const good_id = (item.supplier_reference_id.split('-')[2], 'good id');
    const unit_id =
      (item.supplier_reference_id.split('-').slice(4).join('-'), 'unit id');
    await order.procurement_order_details.create({
      data: {
        order_id: orderId!.id,
        reference_id: item.supplier_reference_id,
        name: item.supplier_item_name,
        order_qty: item.order_qty,
        cut_off_time: item.cut_off_time,
        good_id: Number(good_id),
        unit_id: unit_id,
      },
    });
  }
};

run();
