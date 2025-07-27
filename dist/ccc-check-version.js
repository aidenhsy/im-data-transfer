"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const im_procurement_prod_1 = require("./prisma/clients/im-procurement-prod");
const scm_prod_1 = require("./prisma/clients/scm-prod");
const scm_order_prod_1 = require("./prisma/clients/scm-order-prod");
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const run = async () => {
    const procurement = new im_procurement_prod_1.PrismaClient();
    const basic = new scm_prod_1.PrismaClient();
    const order = new scm_order_prod_1.PrismaClient();
    const basicOrderDetails = await basic.scm_order_details.findMany({
        where: {
            reference_id: {
                not: null,
            },
        },
        include: {
            scm_order: true,
        },
    });
    for (const basicDetail of basicOrderDetails) {
        const dateTime = dayjs_1.default(basicDetail.scm_order?.create_time).utcOffset(0);
        // If time is before 11:30, use the previous day
        const createDate = dateTime.hour() < 11 || (dateTime.hour() === 11 && dateTime.minute() < 30)
            ? dateTime.subtract(1, 'day').format('YYYYMMDD')
            : dateTime.format('YYYYMMDD');
        const referenceDate = basicDetail.reference_id
            ?.split('-')
            .slice(1)
            .join('-');
        if (createDate !== referenceDate) {
            console.log(`reference_id: ${basicDetail.reference_id} \n create_date: ${createDate} \n id: ${basicDetail.id} \n create_time: ${basicDetail.scm_order?.create_time?.toUTCString()}`);
            console.log('--------------------------------');
        }
    }
};
run();
