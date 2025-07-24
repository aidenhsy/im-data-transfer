import { PrismaClient as ImBasicData } from './prisma/clients/im-basic-data-prod';
import { PrismaClient as ImProcurement } from './prisma/clients/im-procurement-prod';

const run = async () => {
  const imBasicData = new ImBasicData();
  const imProcurement = new ImProcurement();

  const allBasicSupplyPlanItems =
    await imBasicData.supply_plan_items.findMany();
  const allImProcurementSupplyPlanItems =
    await imProcurement.supply_plan_items.findMany();

  const notInProcurement = allBasicSupplyPlanItems.filter(
    (item) => !allImProcurementSupplyPlanItems.some((p) => p.id === item.id)
  );

  const notInBasic = allImProcurementSupplyPlanItems.filter(
    (item) => !allBasicSupplyPlanItems.some((p) => p.id === item.id)
  );

  console.log(notInProcurement.length);
  console.log(notInBasic.length);

  // for (const item of notInBasic) {
  //   await imBasicData.supply_plan_items.create({
  //     data: {
  //       ...item,
  //     },
  //   });
  // }

  // for (const item of notInProcurement) {
  //   await imProcurement.supply_plan_items.create({
  //     data: {
  //       ...item,
  //     },
  //   });
  // }
};
run();
