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
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    var imInventory, imProd, oldCounts, _i, oldCounts_1, oldCount, shop, city_id, shop_id, tier_id, newCount, _a, _b, detail, good_id, supplier_item;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                imInventory = new im_inventory_prod_1.PrismaClient();
                imProd = new im_prod_1.PrismaClient();
                return [4 /*yield*/, imProd.scm_inventory_single.findMany({
                        where: {
                            end_date: new Date('2025-05-31')
                        },
                        include: {
                            scm_inventory_detail: true
                        }
                    })];
            case 1:
                oldCounts = _c.sent();
                _i = 0, oldCounts_1 = oldCounts;
                _c.label = 2;
            case 2:
                if (!(_i < oldCounts_1.length)) return [3 /*break*/, 11];
                oldCount = oldCounts_1[_i];
                return [4 /*yield*/, imInventory.scm_shop.findFirst({
                        where: {
                            id: Number(oldCount.shop_id)
                        }
                    })];
            case 3:
                shop = _c.sent();
                if (!shop) {
                    console.log("shop not found: " + oldCount.shop_id);
                    return [3 /*break*/, 10];
                }
                city_id = shop.city_id;
                shop_id = oldCount.shop_id;
                tier_id = shop.client_tier_id;
                return [4 /*yield*/, imInventory.inventory_count.create({
                        data: {
                            id: oldCount.id.toString(),
                            shop_id: oldCount.shop_id,
                            status: 1,
                            count_amount: oldCount.last_amount,
                            finished_at: oldCount.create_time,
                            created_at: oldCount.create_time,
                            updated_at: oldCount.create_time
                        }
                    })];
            case 4:
                newCount = _c.sent();
                _a = 0, _b = oldCount.scm_inventory_detail;
                _c.label = 5;
            case 5:
                if (!(_a < _b.length)) return [3 /*break*/, 10];
                detail = _b[_a];
                good_id = detail.goods_id;
                return [4 /*yield*/, imInventory.supplier_items.findFirst({
                        where: {
                            supplier_reference_id: {
                                startsWith: "20250727-" + tier_id + "-" + good_id + "-" + city_id
                            }
                        }
                    })];
            case 6:
                supplier_item = _c.sent();
                if (!supplier_item) {
                    console.log("supplier_item not found: " + detail.goods_id);
                    return [3 /*break*/, 9];
                }
                return [4 /*yield*/, imInventory.inventory_count_details.create({
                        data: {
                            id: detail.id.toString(),
                            hypo_qty: null,
                            count_qty: detail.qty,
                            weighted_price: Number(detail.price),
                            supplier_item_id: supplier_item.id,
                            inventory_count_id: newCount.id
                        }
                    })];
            case 7:
                _c.sent();
                return [4 /*yield*/, imInventory.shop_item_weighted_price.create({
                        data: {
                            shop_id: Number(shop_id),
                            supplier_item_id: supplier_item.id,
                            weighted_price: Number(detail.price),
                            total_qty: Number(detail.qty),
                            total_value: Number(detail.price) * Number(detail.qty),
                            type: 'stock_count'
                        }
                    })];
            case 8:
                _c.sent();
                _c.label = 9;
            case 9:
                _a++;
                return [3 /*break*/, 5];
            case 10:
                _i++;
                return [3 /*break*/, 2];
            case 11: return [2 /*return*/];
        }
    });
}); };
run();
