import { PrismaClient as ImBasicData } from './prisma/clients/im-basic-data-prod';
import { PrismaClient as ImProcurement } from './prisma/clients/im-procurement-prod';

const run = async () => {
  const imBasicData = new ImBasicData();
  const imProcurement = new ImProcurement();

  const details = await imProcurement.supplier_order_details.findMany({
    where: {
      order_id: '215c559c-f6f4-468b-b32a-61cbc3f22dd3',
    },
  });

  console.log(
    details.map((d) => ({
      name: d.supplier_item_name,
      price: d.price,
      qty: d.order_qty,
      reference_id: d.supplier_reference_id,
      cut_off_time: d.cut_off_time,
    }))
  );
};

run();
