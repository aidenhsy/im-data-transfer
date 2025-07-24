"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_order_prod_1 = require("./prisma/clients/scm-order-prod");
const scm_prod_1 = require("./prisma/clients/scm-prod");
// select o.id
// from supplier_order_details d
//          join supplier_orders o on d.order_id = o.id
// where o.status in (4, 5, 20)
//   and confirm_delivery_qty is null;
const run = async () => {
    const imProcurement = new im_procurement_prod_1.PrismaClient();
    const scmOrder = new scm_order_prod_1.PrismaClient();
    const scm = new scm_prod_1.PrismaClient();
    const missingDetails = await imProcurement.supplier_order_details.findMany({
        where: {
            confirm_delivery_qty: null,
            supplier_orders: {
                status: 20,
            },
        },
    });
    for (const detail of missingDetails) {
        const correspondingScmOrder = await scmOrder.procurement_order_details.findFirst({
            where: {
                reference_id: detail.supplier_reference_id,
                procurement_orders: {
                    client_order_id: detail.order_id,
                },
            },
        });
        if (!correspondingScmOrder) {
            console.log('!! no corresponding scm order', detail.id);
            continue;
        }
        await imProcurement.supplier_order_details.update({
            where: {
                id: detail.id,
            },
            data: {
                confirm_delivery_qty: detail.actual_delivery_qty,
            },
        });
        await scmOrder.procurement_order_details.update({
            where: {
                id: correspondingScmOrder.id,
            },
            data: {
                customer_receive_qty: detail.actual_delivery_qty,
            },
        });
    }
};
run();
