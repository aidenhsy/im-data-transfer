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
var im_inventory_prod_1 = require("../prisma/clients/im-inventory-prod");
var im_prod_1 = require("../prisma/clients/im-prod");
var im_procurement_prod_1 = require("../prisma/clients/im-procurement-prod");
var scm_pricing_prod_1 = require("../prisma/clients/scm-pricing-prod");
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    var imInventory, imProd, imProcurement, scmPricing, oldCounts, missingItems, _i, oldCounts_1, oldCount, shop, city_id, tier_id, _a, _b, detail, good_id, scmGood, supplier_reference_id, supplier_item;
    var _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                imInventory = new im_inventory_prod_1.PrismaClient();
                imProd = new im_prod_1.PrismaClient();
                imProcurement = new im_procurement_prod_1.PrismaClient();
                scmPricing = new scm_pricing_prod_1.PrismaClient();
                return [4 /*yield*/, imProd.scm_inventory_single_copy.findMany({
                        where: {
                            end_date: new Date('2025-06-30')
                        },
                        include: {
                            scm_inventory_detail_copy: true
                        }
                    })];
            case 1:
                oldCounts = _e.sent();
                missingItems = new Set();
                console.log(oldCounts.length);
                _i = 0, oldCounts_1 = oldCounts;
                _e.label = 2;
            case 2:
                if (!(_i < oldCounts_1.length)) return [3 /*break*/, 12];
                oldCount = oldCounts_1[_i];
                return [4 /*yield*/, imInventory.scm_shop.findFirst({
                        where: {
                            id: Number(oldCount.shop_id)
                        }
                    })];
            case 3:
                shop = _e.sent();
                if (!shop) {
                    console.log("shop not found: " + oldCount.shop_id);
                    return [3 /*break*/, 11];
                }
                city_id = shop.city_id;
                tier_id = shop.client_tier_id;
                _a = 0, _b = oldCount.scm_inventory_detail_copy;
                _e.label = 4;
            case 4:
                if (!(_a < _b.length)) return [3 /*break*/, 11];
                detail = _b[_a];
                good_id = detail.goods_id;
                return [4 /*yield*/, scmPricing.scm_goods.findFirst({
                        where: {
                            id: Number(good_id)
                        },
                        include: {
                            scm_good_units_scm_goods_order_good_unit_idToscm_good_units: true
                        }
                    })];
            case 5:
                scmGood = _e.sent();
                supplier_reference_id = scmGood
                    ? "20250731-" + tier_id + "-" + good_id + "-" + city_id + "-" + (scmGood === null || scmGood === void 0 ? void 0 : scmGood.order_good_unit_id)
                    : "20250731-" + tier_id + "-" + good_id + "-" + city_id;
                return [4 /*yield*/, imInventory.supplier_items.findFirst({
                        where: {
                            supplier_reference_id: supplier_reference_id
                        }
                    })];
            case 6:
                supplier_item = _e.sent();
                if (!!supplier_item) return [3 /*break*/, 10];
                missingItems.add(good_id);
                if (!!scmGood) return [3 /*break*/, 8];
                return [4 /*yield*/, imProcurement.supplier_items.create({
                        data: {
                            name: detail.goods_name,
                            status: 0,
                            letter_name: null,
                            supplier_id: 1,
                            photo_url: null,
                            price: Number(detail.price),
                            supplier_reference_id: supplier_reference_id,
                            cut_off_time: '14:00:00',
                            base_unit_id: 1,
                            package_unit_name: null,
                            package_unit_to_base_ratio: 1,
                            city_id: city_id,
                            weighing: 1,
                            tier_id: tier_id
                        }
                    })];
            case 7:
                _e.sent();
                return [3 /*break*/, 10];
            case 8: return [4 /*yield*/, imProcurement.supplier_items.create({
                    data: {
                        name: scmGood.name,
                        status: 0,
                        letter_name: scmGood.letter_name,
                        supplier_id: 1,
                        photo_url: scmGood.photo_url,
                        price: Number(detail.price),
                        supplier_reference_id: supplier_reference_id,
                        cut_off_time: '14:00:00',
                        base_unit_id: scmGood === null || scmGood === void 0 ? void 0 : scmGood.standard_base_unit,
                        package_unit_name: (_c = scmGood === null || scmGood === void 0 ? void 0 : scmGood.scm_good_units_scm_goods_order_good_unit_idToscm_good_units) === null || _c === void 0 ? void 0 : _c.name,
                        package_unit_to_base_ratio: Number((_d = scmGood === null || scmGood === void 0 ? void 0 : scmGood.scm_good_units_scm_goods_order_good_unit_idToscm_good_units) === null || _d === void 0 ? void 0 : _d.ratio_to_base),
                        city_id: city_id,
                        weighing: 1,
                        tier_id: tier_id
                    }
                })];
            case 9:
                _e.sent();
                return [3 /*break*/, 10];
            case 10:
                _a++;
                return [3 /*break*/, 4];
            case 11:
                _i++;
                return [3 /*break*/, 2];
            case 12:
                console.log("\nDistinct missing items (" + missingItems.size + "):");
                return [2 /*return*/];
        }
    });
}); };
run();
