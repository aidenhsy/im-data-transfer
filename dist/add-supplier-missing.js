"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_order_prod_1 = require("./prisma/clients/scm-order-prod");
const scm_pricing_prod_1 = require("./prisma/clients/scm-pricing-prod");
const run = async () => {
    const procurement = new im_procurement_prod_1.PrismaClient();
    const order = new scm_order_prod_1.PrismaClient();
    const pricing = new scm_pricing_prod_1.PrismaClient();
    const missingItems = await procurement.supplier_order_details.findMany({
        where: {
            supplier_item_id: null,
        },
    });
    for (const item of missingItems) {
        const sectionId = item.supplier_reference_id.split('-').slice(2).join('-');
        const pricingItem = await pricing.scm_good_pricing.findFirst({
            where: {
                external_reference_id: {
                    endsWith: sectionId,
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });
        if (!pricingItem) {
            console.log(item.supplier_reference_id, 'not found!');
            continue;
        }
    }
};
run();
