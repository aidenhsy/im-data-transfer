"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_prod_1 = require("./prisma/clients/scm-prod");
const scm_order_prod_1 = require("./prisma/clients/scm-order-prod");
const run = async () => {
    const procurementDB = new im_procurement_prod_1.PrismaClient();
    const basicDB = new scm_prod_1.PrismaClient();
    const orderDB = new scm_order_prod_1.PrismaClient();
    const batchSize = 100;
    let skip = 0;
    let hasMoreOrders = true;
    while (hasMoreOrders) {
        const orders = await orderDB.procurement_orders.findMany({
            select: {
                client_order_id: true,
                procurement_order_details: {
                    select: {
                        reference_id: true,
                        customer_receive_qty: true,
                        id: true,
                    },
                },
            },
            take: batchSize,
            skip: skip,
        });
        if (orders.length < batchSize) {
            hasMoreOrders = false;
        }
        if (orders.length === 0) {
            break;
        }
        const procurementOrders = await procurementDB.supplier_orders.findMany({
            where: {
                id: {
                    in: orders.map((order) => order.client_order_id),
                },
            },
            select: {
                id: true,
                supplier_order_details: {
                    select: {
                        id: true,
                        supplier_reference_id: true,
                        confirm_delivery_qty: true,
                    },
                },
            },
        });
        for (const order of orders) {
            const procurementOrder = procurementOrders.find((o) => o.id === order.client_order_id);
            if (!procurementOrder) {
                console.log(`${order.client_order_id} not found`);
                continue;
            }
            for (const orderDetail of order.procurement_order_details) {
                const procurementDetail = procurementOrder.supplier_order_details.find((d) => d.supplier_reference_id === orderDetail.reference_id);
                if (!procurementDetail) {
                    console.log(`${orderDetail.reference_id} not found`);
                    continue;
                }
                if (Number(procurementDetail.confirm_delivery_qty) !==
                    Number(orderDetail.customer_receive_qty)) {
                    await orderDB.procurement_order_details.update({
                        where: {
                            id: orderDetail.id,
                        },
                        data: {
                            customer_receive_qty: procurementDetail.confirm_delivery_qty,
                        },
                    });
                    console.log(`${orderDetail.reference_id} difference ${procurementDetail.confirm_delivery_qty} ${orderDetail.customer_receive_qty} \n id: ${order.client_order_id} \n `);
                    console.log('-----------');
                }
            }
        }
        // Move to the next batch
        skip += batchSize;
    }
};
run();
