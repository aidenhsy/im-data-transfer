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
        const sectionId = item.supplier_reference_id.split('-').slice(1).join('-');
        const pricingItem = await pricing.scm_good_pricing.findFirst({
            where: {
                external_reference_id: {
                    endsWith: sectionId,
                },
            },
            include: {
                scm_goods: true,
                scm_good_units: true,
            },
            orderBy: {
                created_at: 'desc',
            },
        });
        if (!pricingItem) {
            console.log(item.supplier_reference_id, 'not found!');
            continue;
        }
        console.log(sectionId);
        await procurement.supplier_items.upsert({
            where: {
                supplier_reference_id: `20250729-${sectionId}`,
            },
            update: {},
            create: {
                name: pricingItem.scm_goods.name,
                status: 0,
                letter_name: pricingItem.scm_goods.letter_name,
                supplier_id: 1,
                photo_url: pricingItem.scm_goods.photo_url,
                price: pricingItem.sale_price,
                supplier_reference_id: `20250729-${sectionId}`,
                cut_off_time: pricingItem.cut_off_time,
                package_unit_to_base_ratio: Number(pricingItem.scm_good_units.ratio_to_base),
                package_unit_name: pricingItem.scm_good_units.name,
                base_unit_id: pricingItem.scm_goods.standard_base_unit,
                city_id: pricingItem.city_id,
                weighing: pricingItem.scm_goods.weighing,
                tier_id: pricingItem.client_tier_id,
            },
        });
    }
    console.log('done');
};
run();
