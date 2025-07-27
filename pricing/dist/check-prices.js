"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var im_procurement_prod_1 = require("../prisma/clients/im-procurement-prod");
var scm_prod_1 = require("../prisma/clients/scm-prod");
var scm_pricing_prod_1 = require("../prisma/clients/scm-pricing-prod");
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    var imProcurement, scm, scmPricing, goods, length, i, _i, goods_1, good, pricing, pricings, _a, pricings_1, item, correctPrice;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                imProcurement = new im_procurement_prod_1.PrismaClient();
                scm = new scm_prod_1.PrismaClient();
                scmPricing = new scm_pricing_prod_1.PrismaClient();
                return [4 /*yield*/, scm.scm_goods.findMany()];
            case 1:
                goods = _b.sent();
                length = goods.length;
                i = 0;
                _i = 0, goods_1 = goods;
                _b.label = 2;
            case 2:
                if (!(_i < goods_1.length)) return [3 /*break*/, 6];
                good = goods_1[_i];
                i++;
                if (i % 1000 === 0) {
                    console.log(i + "/" + length);
                }
                return [4 /*yield*/, scmPricing.scm_goods.findFirst({
                        where: {
                            id: good.id
                        }
                    })];
            case 3:
                pricing = _b.sent();
                if (!pricing) {
                    console.log(good.id + " " + good.name + " not found");
                }
                if (Number(good.price) !== Number(pricing === null || pricing === void 0 ? void 0 : pricing.price)) {
                    console.log(good.id + " " + good.name + " " + good.price + " " + (pricing === null || pricing === void 0 ? void 0 : pricing.price) + " not good price ");
                }
                return [4 /*yield*/, scmPricing.scm_good_pricing.findMany({
                        where: {
                            goods_id: good.id,
                            version: '20250727'
                        }
                    })];
            case 4:
                pricings = _b.sent();
                for (_a = 0, pricings_1 = pricings; _a < pricings_1.length; _a++) {
                    item = pricings_1[_a];
                    if (item.pricing_strategy === 'margin') {
                        correctPrice = Math.round(Number(good.price) * (1 + Number(item.profit_margin) / 100) * 100) / 100;
                        if (Number(correctPrice) !== Number(item.sale_price)) {
                            console.log(good.id + " " + good.name + " " + correctPrice + " " + item.sale_price + " not margin price equal");
                        }
                    }
                }
                _b.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 2];
            case 6: return [2 /*return*/];
        }
    });
}); };
run();
