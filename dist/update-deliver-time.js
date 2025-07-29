"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scm_prod_1 = require("./prisma/clients/scm-prod");
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_order_prod_1 = require("./prisma/clients/scm-order-prod");
const run = async () => {
    const scm = new scm_prod_1.PrismaClient();
    const imProcurement = new im_procurement_prod_1.PrismaClient();
    const scmOrder = new scm_order_prod_1.PrismaClient();
    const scmOrders = await scmOrder.procurement_orders.findMany();
    const imProcurementOrders = await imProcurement.supplier_orders.findMany();
    const missingScmOrders = imProcurementOrders.filter((item) => !scmOrders.some((scm) => scm.client_order_id === item.id));
    const missingImProcurementOrders = scmOrders.filter((item) => !imProcurementOrders.some((im) => im.id === item.client_order_id));
    console.log(missingScmOrders.length, 'missingScmOrders');
    console.log(missingScmOrders.map((item) => item.id));
    console.log(missingImProcurementOrders.length, 'missingImProcurementOrders');
};
run();
