"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_order_prod_1 = require("./prisma/clients/scm-order-prod");
const scm_prod_1 = require("./prisma/clients/scm-prod");
const run = async () => {
    const imProcurement = new im_procurement_prod_1.PrismaClient();
    const scmOrder = new scm_order_prod_1.PrismaClient();
    const scm = new scm_prod_1.PrismaClient();
    const orderDetails = await imProcurement.supplier_order_details.findMany({
        where: {
            actual_delivery_qty: null,
            supplier_orders: {
                status: 20,
            },
        },
    });
    for (const detail of orderDetails) {
        const scmDetail = await scmOrder.procurement_order_details.findFirst({
            where: {
                reference_id: detail.supplier_reference_id,
                procurement_orders: {
                    client_order_id: detail.order_id,
                },
            },
        });
        if (!scmDetail) {
            console.log(detail.id);
            continue;
        }
        await imProcurement.supplier_order_details.update({
            where: {
                id: detail.id,
            },
            data: {
                confirm_delivery_qty: scmDetail.deliver_qty,
            },
        });
        await scmOrder.procurement_order_details.update({
            where: {
                id: scmDetail.id,
            },
            data: {
                customer_receive_qty: scmDetail.deliver_qty,
            },
        });
    }
};
run();
