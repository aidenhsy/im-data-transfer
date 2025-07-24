"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_basic_data_prod_1 = require("./prisma/clients/im-basic-data-prod");
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const run = async () => {
    const imBasicData = new im_basic_data_prod_1.PrismaClient();
    const imProcurement = new im_procurement_prod_1.PrismaClient();
    const allBasicSupplyPlanItems = await imBasicData.supply_plan_items.findMany();
    const allImProcurementSupplyPlanItems = await imProcurement.supply_plan_items.findMany();
    const notInProcurement = allBasicSupplyPlanItems.filter((item) => !allImProcurementSupplyPlanItems.some((p) => p.id === item.id));
    const notInBasic = allImProcurementSupplyPlanItems.filter((item) => !allBasicSupplyPlanItems.some((p) => p.id === item.id));
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
