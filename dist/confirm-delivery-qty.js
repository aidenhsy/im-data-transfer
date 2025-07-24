"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_order_prod_1 = require("./prisma/clients/scm-order-prod");
const scm_prod_1 = require("./prisma/clients/scm-prod");
const run = async () => {
    const imProcurement = new im_procurement_prod_1.PrismaClient();
    const scmOrder = new scm_order_prod_1.PrismaClient();
    const scm = new scm_prod_1.PrismaClient();
    const orders = await imProcurement.supplier_orders.findMany({
        where: {
            status: 20,
        },
        include: {
            supplier_order_details: true,
        },
    });
    for (const order of orders) {
        let missMatch = 0;
        for (const detail of order.supplier_order_details) {
            if (Number(detail.confirm_delivery_qty) !==
                Number(detail.actual_delivery_qty)) {
                missMatch++;
            }
        }
        if (missMatch === 0) {
            console.log(order.id);
        }
    }
};
run();
