"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_order_prod_1 = require("./prisma/clients/scm-order-prod");
const scm_prod_1 = require("./prisma/clients/scm-prod");
const run = async () => {
    const imProcurement = new im_procurement_prod_1.PrismaClient();
    const scmOrder = new scm_order_prod_1.PrismaClient();
    const scm = new scm_prod_1.PrismaClient();
    const scmProdOrders = await scm.scm_order_details.findMany({
        where: {
            reference_order_id: {
                not: null,
            },
        },
    });
    for (const order of scmProdOrders) {
        const imProcurementDetail = await imProcurement.supplier_order_details.findFirst({
            where: {
                order_id: order.reference_order_id,
                supplier_reference_id: order.reference_id,
            },
        });
        if (!imProcurementDetail) {
            console.log('!! no procurement');
            continue;
        }
        const correspondingScmOrder = await scmOrder.procurement_order_details.findFirst({
            where: {
                reference_id: imProcurementDetail.supplier_reference_id,
                procurement_orders: {
                    client_order_id: imProcurementDetail.order_id,
                },
            },
        });
        if (!correspondingScmOrder) {
            console.log('!! no scm order');
            continue;
        }
        if (!correspondingScmOrder.deliver_qty) {
            console.log('!! update deliver qty for scm order', correspondingScmOrder.id);
            await scmOrder.procurement_order_details.update({
                where: {
                    id: correspondingScmOrder.id,
                },
                data: {
                    deliver_qty: order.deliver_goods_qty,
                },
            });
        }
        if (!imProcurementDetail.actual_delivery_qty) {
            console.log('!! update deliver qty for im procurement', imProcurementDetail.id);
            await imProcurement.supplier_order_details.update({
                where: {
                    id: imProcurementDetail.id,
                },
                data: {
                    actual_delivery_qty: order.deliver_goods_qty,
                },
            });
        }
    }
};
run();
