"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_prod_1 = require("./prisma/clients/scm-prod");
const scm_order_prod_1 = require("./prisma/clients/scm-order-prod");
const run = async () => {
    const procurement = new im_procurement_prod_1.PrismaClient();
    const basic = new scm_prod_1.PrismaClient();
    const order = new scm_order_prod_1.PrismaClient();
    const scmOrders = await order.procurement_orders.findMany({
        include: {
            procurement_order_details: true,
        },
        where: {
            id: {
                in: [
                    '709b55d3-cdf2-4771-8552-3c93fdff5d78',
                    '5e6c775d-8efa-466b-8d1a-e4187f175107',
                    '1fc7bae4-352c-429f-bf46-b49ef235606f',
                    'f74ae29e-ddd0-4875-a4ba-f8279b957541',
                    '14829d81-316f-4d9b-9d30-8137c8dd5ecd',
                    '37a7010b-566c-4f55-9a1f-63dba09baaf6',
                    '6353a3e5-b0c6-42e4-be69-758291a5bb72',
                    'e2fc73bd-af99-4bc7-9465-65ec0825639b',
                ],
            },
        },
    });
    for (const scmOrder of scmOrders) {
        for (const scmDetail of scmOrder.procurement_order_details) {
            const procurementDetail = await procurement.supplier_order_details.findFirst({
                where: {
                    order_id: scmOrder.client_order_id,
                    supplier_reference_id: scmDetail.reference_id,
                },
            });
            const basicDetail = await basic.scm_order_details.findFirst({
                where: {
                    reference_id: scmDetail.reference_id,
                    reference_order_id: scmOrder.client_order_id,
                },
            });
            if (!basicDetail) {
                console.log(`not found: ${scmDetail.reference_id} ${scmOrder.client_order_id}`);
                continue;
            }
            if (!procurementDetail) {
                console.log(`procurementDetail not found: ${scmDetail.reference_id}`);
                continue;
            }
            await procurement.supplier_order_details.update({
                where: {
                    id: procurementDetail.id,
                },
                data: {
                    actual_delivery_qty: scmDetail.customer_receive_qty,
                    final_qty: scmDetail.customer_receive_qty,
                },
            });
            await basic.scm_order_details.update({
                where: {
                    id: basicDetail.id,
                },
                data: {
                    delivery_qty: scmDetail.customer_receive_qty,
                    deliver_goods_qty: scmDetail.customer_receive_qty,
                },
            });
            await order.procurement_order_details.update({
                where: {
                    id: scmDetail.id,
                },
                data: {
                    deliver_qty: scmDetail.customer_receive_qty,
                    final_qty: scmDetail.customer_receive_qty,
                },
            });
        }
    }
};
run();
