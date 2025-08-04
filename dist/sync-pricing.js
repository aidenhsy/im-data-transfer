"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scm_pricing_prod_1 = require("./prisma/clients/scm-pricing-prod");
const run = async () => {
    const scmPricing = new scm_pricing_prod_1.PrismaClient();
    const pricings = await scmPricing.scm_good_pricing.findMany();
    for (const pricing of pricings) {
        const baseCost = Number((Number(pricing.sale_price) /
            (1 + Number(pricing.profit_margin) / 100)).toFixed(4));
        if (Number(pricing.weighted_average_cost) !== Number(baseCost)) {
            console.log(pricing.weighted_average_cost, baseCost);
        }
    }
};
run();
