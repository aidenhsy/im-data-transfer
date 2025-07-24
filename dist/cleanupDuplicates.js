"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scm_pricing_prod_1 = require("./prisma/clients/scm-pricing-prod");
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const run = async () => {
    const scmPricing = new scm_pricing_prod_1.PrismaClient();
    const imProcurement = new im_procurement_prod_1.PrismaClient();
    const res = await scmPricing.$queryRaw `
    SELECT client_tier_id, version, city_id, goods_id, COUNT(*) as count
    FROM scm_good_pricing
    GROUP BY client_tier_id, version, city_id, goods_id
    HAVING COUNT(*) > 1;
  `;
    for (const row of res) {
        let deleted = 0;
        const pricings = await scmPricing.scm_good_pricing.findMany({
            where: {
                client_tier_id: row.client_tier_id,
                version: row.version,
                city_id: row.city_id,
                goods_id: row.goods_id,
            },
        });
        for (const pricing of pricings) {
            const ims = await imProcurement.supplier_order_details.findMany({
                where: {
                    supplier_reference_id: pricing.external_reference_id,
                },
            });
            const supplierGoods = await imProcurement.supplier_items.findMany({
                where: {
                    supplier_reference_id: pricing.external_reference_id,
                },
            });
            console.log(pricing.external_reference_id);
            console.log(ims.length);
            console.log(supplierGoods.length);
            if (ims.length === 0 && supplierGoods.length === 0 && deleted === 0) {
                deleted++;
                await scmPricing.scm_good_pricing.delete({
                    where: {
                        id: pricing.id,
                    },
                });
            }
        }
        console.log('--------------------------------');
    }
    console.log('done');
    process.exit(0);
};
run();
