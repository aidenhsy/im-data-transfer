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
    const missingOrders = await imProcurement.supplier_orders.findMany({
        where: {
            id: {
                notIn: scmOrders.map((item) => item.client_order_id),
            },
        },
    });
    console.log(missingOrders);
    console.log(missingOrders.map((item) => item.id));
    console.log(missingOrders.length);
};
run();
