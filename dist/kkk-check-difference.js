"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_prod_1 = require("./prisma/clients/scm-prod");
const scm_order_prod_1 = require("./prisma/clients/scm-order-prod");
const run = async () => {
    const procurement = new im_procurement_prod_1.PrismaClient();
    const basic = new scm_prod_1.PrismaClient();
    const order = new scm_order_prod_1.PrismaClient();
    const batchSize = 100;
    let skip = 0;
    let hasMoreOrders = true;
    const total = await order.procurement_orders.count();
    while (hasMoreOrders) {
        console.log(`${skip}/${total}`);
        const orders = await order.procurement_orders.findMany({
            select: {
                client_order_id: true,
                procurement_order_details: {
                    select: {
                        reference_id: true,
                        deliver_qty: true,
                    },
                },
            },
            take: batchSize,
            skip: skip,
        });
        // If we got fewer orders than the batch size, this is the last batch
        if (orders.length < batchSize) {
            hasMoreOrders = false;
        }
        // If no orders found, break the loop
        if (orders.length === 0) {
            break;
        }
        const procurementOrders = await procurement.supplier_orders.findMany({
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
                        actual_delivery_qty: true,
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
                if (Number(procurementDetail.actual_delivery_qty) !==
                    Number(orderDetail.deliver_qty)) {
                    console.log(`${orderDetail.reference_id} difference ${procurementDetail.actual_delivery_qty} ${orderDetail.deliver_qty} \n id: ${order.client_order_id} \n `);
                    await procurement.supplier_order_details.update({
                        where: {
                            id: procurementDetail.id,
                        },
                        data: {
                            actual_delivery_qty: Number(orderDetail.deliver_qty),
                            confirm_delivery_qty: Number(orderDetail.deliver_qty),
                        },
                    });
                    console.log('-----------');
                }
            }
        }
        // Move to the next batch
        skip += batchSize;
    }
    console.log('Finished processing all orders');
};
run();
