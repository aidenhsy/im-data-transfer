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
        orderBy: {
            created_at: 'desc',
        },
        where: {
            status: {
                in: [2, 4, 5, 20],
            },
        },
        include: {
            supplier_order_details: true,
        },
    });
    for (const procurementOrder of procurementOrders) {
        for (const procurementDetail of procurementOrder.supplier_order_details) {
            const scmDetail = await order.procurement_order_details.findFirst({
                where: {
                    reference_id: procurementDetail.supplier_reference_id,
                    procurement_orders: {
                        client_order_id: procurementOrder.id,
                    },
                },
            });
            const scmBasic = await basic.scm_order_details.findFirst({
                where: {
                    reference_id: procurementDetail.supplier_reference_id,
                    reference_order_id: procurementOrder.id,
                },
            });
            if (!scmDetail) {
                console.log(`${procurementOrder.id} ${procurementDetail.supplier_reference_id} scm order missing`);
                continue;
            }
            if (!scmBasic) {
                console.log(`${procurementOrder.id} ${procurementDetail.supplier_reference_id} scm basic missing`);
                continue;
            }
            if (Number(scmBasic.deliver_goods_qty) !== Number(scmDetail.deliver_qty) ||
                Number(scmBasic.deliver_goods_qty) !==
                    Number(procurementDetail.actual_delivery_qty)) {
                console.log(`${procurementOrder.id} ${procurementDetail.supplier_reference_id} \n current status: ${procurementOrder.status} \n scm order: ${scmDetail.deliver_qty} \n scm basic: ${scmBasic.deliver_goods_qty} \n procurement: ${procurementDetail.actual_delivery_qty}`);
                console.log('--------------------------------');
            }
        }
    }
};
run();
