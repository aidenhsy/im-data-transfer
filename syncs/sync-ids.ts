import { PrismaClient as ImBasicData } from '../prisma/clients/im-basic-data-prod';
import { PrismaClient as ImProcurement } from '../prisma/clients/im-procurement-prod';

const run = async () => {
  const imBasicDataDB = new ImBasicData();
  const imProcurementDB = new ImProcurement();

  const supply_plan_items = await imProcurementDB.supply_plan_items.findMany();

  for (const item of supply_plan_items) {
    const supply_plan_item = await imBasicDataDB.supply_plan_items.findUnique({
      where: {
        supply_plan_id_item_id: {
          item_id: Number(item.item_id),
          supply_plan_id: Number(item.supply_plan_id),
        },
      },
    });
    if (!supply_plan_item) {
      console.log('Not found', item.item_id, item.supply_plan_id);
    }
    if (supply_plan_item?.id !== item.id) {
      console.log('Not match', item.item_id, item.supply_plan_id);
    }
  }
};

run();
