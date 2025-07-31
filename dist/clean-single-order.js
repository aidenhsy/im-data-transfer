"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_prod_1 = require("./prisma/clients/scm-prod");
const scm_order_prod_1 = require("./prisma/clients/scm-order-prod");
const run = async () => {
    const procurement = new im_procurement_prod_1.PrismaClient();
    const basic = new scm_prod_1.PrismaClient();
    const order = new scm_order_prod_1.PrismaClient();
    const items = await procurement.supplier_order_details.findMany({
        where: {
            order_id: '34b9b77d-9bf3-4403-a87a-41cd7a08a9e8',
        },
    });
    const orderId = await order.procurement_orders.findFirst({
        where: {
            client_order_id: '34b9b77d-9bf3-4403-a87a-41cd7a08a9e8',
        },
    });
    for (const item of items) {
        const good_id = (item.supplier_reference_id.split('-')[2], 'good id');
        const unit_id = (item.supplier_reference_id.split('-').slice(4).join('-'), 'unit id');
        await order.procurement_order_details.create({
            data: {
                order_id: orderId.id,
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
