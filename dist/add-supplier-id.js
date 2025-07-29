"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_order_prod_1 = require("./prisma/clients/scm-order-prod");
const scm_pricing_prod_1 = require("./prisma/clients/scm-pricing-prod");
const run = async () => {
    const procurement = new im_procurement_prod_1.PrismaClient();
    const order = new scm_order_prod_1.PrismaClient();
    const pricing = new scm_pricing_prod_1.PrismaClient();
    const batchSize = 100;
    let skip = 0;
    let totalProcessed = 0;
    const total = await procurement.supplier_order_details.count({
        where: {
            supplier_item_id: null,
        },
    });
    while (true) {
        const procurementDetails = await procurement.supplier_order_details.findMany({
            orderBy: {
                created_at: 'desc',
            },
            where: {
                supplier_item_id: null,
            },
            take: batchSize,
            skip: skip,
        });
        // If no more records, break the loop
        if (procurementDetails.length === 0) {
            break;
        }
        console.log(`${skip} / ${total}`);
        for (const procurementDetail of procurementDetails) {
            const supplierItem = await procurement.supplier_items.findFirst({
                where: {
                    supplier_reference_id: procurementDetail.supplier_reference_id,
                },
            });
            if (supplierItem) {
                await procurement.supplier_order_details.update({
                    where: {
                        id: procurementDetail.id,
                    },
                    data: {
                        supplier_item_id: supplierItem.id,
                    },
                });
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
        totalProcessed += procurementDetails.length;
        skip += batchSize;
        // If we got fewer records than the batch size, we've reached the end
        if (procurementDetails.length < batchSize) {
            break;
        }
    }
    console.log(`Total records processed: ${totalProcessed}`);
};
run();
