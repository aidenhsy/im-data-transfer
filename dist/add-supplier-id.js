"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_order_prod_1 = require("./prisma/clients/scm-order-prod");
const scm_pricing_prod_1 = require("./prisma/clients/scm-pricing-prod");
const run = async () => {
    const procurement = new im_procurement_prod_1.PrismaClient();
    const order = new scm_order_prod_1.PrismaClient();
    const pricing = new scm_pricing_prod_1.PrismaClient();
    const procurementDetails = await procurement.supplier_order_details.findMany({
        orderBy: {
            created_at: 'desc',
        },
        take: 100,
        skip: 0,
    });
    for (const procurementDetail of procurementDetails) {
        const supplierItem = await procurement.supplier_items.findFirst({
            where: {
                supplier_reference_id: procurementDetail.supplier_reference_id,
            },
        });
        if (supplierItem) {
            console.log(supplierItem.id);
            continue;
        }
        const sectionId = procurementDetail.supplier_reference_id
            .split('-')
            .slice(2)
            .join('-');
        const supplierItem2 = await procurement.supplier_items.findFirst({
            where: {
                supplier_reference_id: {
                    endsWith: sectionId,
                },
            },
        });
        if (supplierItem2) {
            await procurement.supplier_order_details.update({
                where: {
                    id: procurementDetail.id,
                },
                data: {
                    supplier_item_id: supplierItem2.id,
                },
            });
            continue;
        }
        console.log(procurementDetail.supplier_reference_id, 'not found!');
    }
};
run();
