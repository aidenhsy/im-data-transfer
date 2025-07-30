"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const im_basic_data_prod_1 = require("./prisma/clients/im-basic-data-prod");
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const run = async () => {
    const imBasicData = new im_basic_data_prod_1.PrismaClient();
    const imProcurement = new im_procurement_prod_1.PrismaClient();
    const details = await imProcurement.supplier_order_details.findMany({
        where: {
            order_id: '215c559c-f6f4-468b-b32a-61cbc3f22dd3',
        },
    });
    console.log(details.map((d) => ({
        name: d.supplier_item_name,
        price: d.price,
        qty: d.order_qty,
        reference_id: d.supplier_reference_id,
        cut_off_time: d.cut_off_time,
    })));
};
run();
