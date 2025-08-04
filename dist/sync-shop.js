"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_order_prod_1 = require("./prisma/clients/scm-order-prod");
const run = async () => {
    const procurement = new im_procurement_prod_1.PrismaClient();
    const order = new scm_order_prod_1.PrismaClient();
    const pCities = await procurement.cities.findMany();
    const pShops = await procurement.scm_shop.findMany();
    for (const pCity of pCities) {
        await order.cities.upsert({
            where: {
                id: pCity.id,
            },
            update: {
                ...pCity,
            },
            create: {
                ...pCity,
            },
        });
    }
    for (const pShop of pShops) {
        const { big_org_id, shop_pic_url, ...rest } = pShop;
        await order.scm_shop.upsert({
            where: {
                id: pShop.id,
            },
            update: {
                ...rest,
                organization_id: 1,
                business_id: 0,
            },
            create: {
                ...rest,
                organization_id: 1,
                business_id: 0,
            },
        });
    }
};
run();
