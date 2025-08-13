"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_prod_1 = require("./prisma/clients/scm-prod");
const run = async () => {
    const procurement = new im_procurement_prod_1.PrismaClient();
    const basic = new scm_prod_1.PrismaClient();
    const orders = await procurement.supplier_orders.findMany({
        where: {
            receive_time: {
                gt: '2025-07-01T00:00:00.000Z',
                lt: '2025-07-31T23:59:59.999Z',
            },
            status: {
                in: [4, 5],
            },
        },
        include: {
            supplier_order_details: true,
        },
    });
    for (const order of orders) {
        const { supplier_order_details, ...rest } = order;
        for (const detail of supplier_order_details) {
            const { final_qty, ...rest } = detail;
            const scmItem = await basic.scm_order_details.findFirst({
                where: {
                    reference_id: detail.supplier_reference_id,
                    reference_order_id: rest.id,
                },
            });
            if (Number(scmItem?.delivery_qty) !== Number(final_qty)) {
                console.log(scmItem?.delivery_qty, final_qty);
            }
        }
    }
};
run();
