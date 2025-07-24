"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_order_prod_1 = require("./prisma/clients/scm-order-prod");
const scm_prod_1 = require("./prisma/clients/scm-prod");
const run = async () => {
    const imProcurement = new im_procurement_prod_1.PrismaClient();
    const scmOrder = new scm_order_prod_1.PrismaClient();
    const scm = new scm_prod_1.PrismaClient();
    const orders = await imProcurement.supplier_orders.findMany({
        where: {
            supplier_order_details: {
                some: {
                    actual_delivery_qty: null,
                },
            },
            status: {
                in: [2, 4, 5, 20],
            },
        },
        include: {
            supplier_order_details: true,
        },
    });
    for (const order of orders) {
        console.log(order.created_at);
        // for (const detail of order.supplier_order_details) {
        //   const scmProdOrderDetail = await scm.scm_order_details.findFirst({
        //     where: {
        //       reference_id: detail.supplier_reference_id,
        //       reference_order_id: order.id,
        //     },
        //   });
        //   console.log(scmProdOrderDetail);
        // }
    }
    console.log(orders.length);
};
run();
