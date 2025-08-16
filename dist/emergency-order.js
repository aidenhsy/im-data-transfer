"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const im_procurement_dev_1 = require("./prisma/clients/im-procurement-dev");
const axios_1 = __importDefault(require("axios"));
const run = async () => {
    const prod = new im_procurement_prod_1.PrismaClient();
    const dev = new im_procurement_dev_1.PrismaClient();
    const orders = await dev.supplier_orders.findMany({
        where: {
            shop_id: {
                in: [3, 5, 15, 24, 35, 42, 51, 111, 127, 137],
            },
            type: 3,
            created_at: {
                gt: new Date('2025-08-12'),
            },
        },
        include: {
            supplier_order_details: true,
        },
    });
    for (const order of orders) {
        const { supplier_order_details, ...rest } = order;
        await prod.supplier_orders.create({
            data: rest,
        });
        await prod.supplier_order_details.createMany({
            data: supplier_order_details.map((detail) => {
                const { total_order_amount, total_final_amount, ...rest } = detail;
                return {
                    ...rest,
                };
            }),
        });
        await prod.submit_cart_attempts.create({
            data: {
                shop_id: rest.shop_id,
                type: 'daily-procurement-15:00',
                items_num: supplier_order_details.length,
                order_id: rest.id,
            },
        });
        await axios_1.default.post(`https://scmms.shaihukeji.com/order/place-order`, {
            store_id: rest.shop_id,
            client_order_id: rest.id,
            type: 3,
            items: supplier_order_details.map((item) => ({
                name: item.supplier_item_name,
                price: item.price.toString(),
                qty: Number(item.order_qty),
                reference_id: item.supplier_reference_id,
                photo_url: item.supplier_item_photo,
                cut_off_time: item.cut_off_time,
            })),
        });
    }
    console.log(orders.length);
};
run();
