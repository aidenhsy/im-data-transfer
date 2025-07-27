"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_prod_1 = require("./prisma/clients/scm-prod");
const scm_order_prod_1 = require("./prisma/clients/scm-order-prod");
const run = async () => {
    const procurement = new im_procurement_prod_1.PrismaClient();
    const basic = new scm_prod_1.PrismaClient();
    const order = new scm_order_prod_1.PrismaClient();
    const procurementOrders = await procurement.supplier_orders.findMany({
        where: {
            status: {
                notIn: [2, 4, 5, 20],
            },
        },
        include: {
            supplier_order_details: true,
        },
    });
    // Add your logic here
    console.log(`Found ${procurementOrders.length} procurement orders`);
    for (const procurementOrder of procurementOrders) {
        for (const procurementDetail of procurementOrder.supplier_order_details) {
            const basicDetail = await basic.scm_order_details.findFirst({
                where: {
                    reference_id: procurementDetail.supplier_reference_id,
                    reference_order_id: procurementOrder.id,
                },
            });
            if (!basicDetail) {
                continue;
            }
            const scmOrderDetail = await order.procurement_order_details.findFirst({
                where: {
                    reference_id: procurementDetail.supplier_reference_id,
                    procurement_orders: {
                        client_order_id: procurementOrder.id,
                    },
                },
            });
            if (!scmOrderDetail) {
                continue;
            }
            await procurement.supplier_order_details.update({
                where: {
                    id: procurementDetail.id,
                },
                data: {
                    actual_delivery_qty: Number(basicDetail.deliver_goods_qty),
                },
            });
            await procurement.supplier_orders.update({
                where: {
                    id: procurementOrder.id,
                },
                data: {
                    status: 2,
                },
            });
            await order.procurement_order_details.update({
                where: {
                    id: scmOrderDetail.id,
                },
                data: {
                    deliver_qty: Number(basicDetail.deliver_goods_qty),
                },
            });
            await order.procurement_orders.update({
                where: {
                    id: scmOrderDetail.order_id,
                },
                data: {
                    status: 3,
                },
            });
        }
    }
    await procurement.$disconnect();
    await basic.$disconnect();
    await order.$disconnect();
};
run().catch(console.error);
