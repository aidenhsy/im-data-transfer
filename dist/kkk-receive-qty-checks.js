"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_order_prod_1 = require("./prisma/clients/scm-order-prod");
const run = async () => {
    const procurement = new im_procurement_prod_1.PrismaClient();
    const order = new scm_order_prod_1.PrismaClient();
    const procurementOrders = await procurement.supplier_orders.findMany({
        where: {
            status: {
                in: [4, 5, 20],
            },
        },
        orderBy: {
            created_at: 'desc',
        },
        include: {
            supplier_order_details: true,
        },
    });
    for (const procurementOrder of procurementOrders) {
        for (const procurementDetail of procurementOrder.supplier_order_details) {
            if (procurementDetail.confirm_delivery_qty === null) {
                console.log(`${procurementOrder.id} ${procurementDetail.supplier_reference_id} actual delivery qty is null`);
                continue;
            }
            const scmDetail = await order.procurement_order_details.findFirst({
                where: {
                    reference_id: procurementDetail.supplier_reference_id,
                    procurement_orders: {
                        client_order_id: procurementOrder.id,
                    },
                },
            });
            if (!scmDetail) {
                console.log(`${procurementOrder.id} ${procurementDetail.supplier_reference_id} scm order missing`);
                continue;
            }
            if (Number(procurementDetail.confirm_delivery_qty) >
                Number(procurementDetail.actual_delivery_qty)) {
                await procurement.supplier_order_details.update({
                    where: {
                        id: procurementDetail.id,
                    },
                    data: {
                        confirm_delivery_qty: Number(procurementDetail.actual_delivery_qty),
                    },
                });
                await order.procurement_order_details.update({
                    where: {
                        id: scmDetail.id,
                    },
                    data: {
                        customer_receive_qty: Number(procurementDetail.actual_delivery_qty),
                    },
                });
                continue;
            }
            await order.procurement_order_details.update({
                where: {
                    id: scmDetail.id,
                },
                data: {
                    customer_receive_qty: Number(procurementDetail.confirm_delivery_qty),
                },
            });
        }
    }
};
run();
