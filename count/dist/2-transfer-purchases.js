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
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    var imInventory, batchSize, skip, hasMoreOrders, total, _loop_1, state_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                imInventory = new im_inventory_prod_1.PrismaClient();
                batchSize = 100;
                skip = 0;
                hasMoreOrders = true;
                return [4 /*yield*/, imInventory.supplier_orders.count({
                        where: {
                            status: {
                                "in": [4, 5]
                            }
                        }
                    })];
            case 1:
                total = _a.sent();
                console.log("Total orders to process: " + total);
                _loop_1 = function () {
                    var orders, shopItemCombinations, orderDetails, _i, orders_1, order, _a, _b, detail, key, existingPrices, priceMap, _c, existingPrices_1, price, key, dataToInsert, _d, orderDetails_1, _e, order, detail, key, existingItem, oldTotalQty, oldTotalValue, newTotalQty, newTotalValue, newWeightedPrice;
                    return __generator(this, function (_f) {
                        switch (_f.label) {
                            case 0:
                                console.log("Processing batch " + (Math.floor(skip / batchSize) + 1) + " of " + Math.ceil(total / batchSize));
                                return [4 /*yield*/, imInventory.supplier_orders.findMany({
                                        where: {
                                            status: {
                                                "in": [4, 5]
                                            }
                                        },
                                        include: {
                                            supplier_order_details: true
                                        },
                                        orderBy: {
                                            receive_time: 'asc'
                                        },
                                        skip: skip,
                                        take: batchSize
                                    })];
                            case 1:
                                orders = _f.sent();
                                if (orders.length === 0) {
                                    hasMoreOrders = false;
                                    return [2 /*return*/, "break"];
                                }
                                if (orders.length < batchSize) {
                                    hasMoreOrders = false;
                                }
                                shopItemCombinations = new Set();
                                orderDetails = [];
                                for (_i = 0, orders_1 = orders; _i < orders_1.length; _i++) {
                                    order = orders_1[_i];
                                    for (_a = 0, _b = order.supplier_order_details; _a < _b.length; _a++) {
                                        detail = _b[_a];
                                        key = order.shop_id + "-" + detail.supplier_item_id;
                                        shopItemCombinations.add(key);
                                        orderDetails.push({ order: order, detail: detail });
                                    }
                                }
                                return [4 /*yield*/, imInventory.shop_item_weighted_price.findMany({
                                        where: {
                                            OR: Array.from(shopItemCombinations).map(function (key) {
                                                var _a = key.split('-'), shop_id = _a[0], supplier_item_id = _a[1];
                                                return {
                                                    shop_id: parseInt(shop_id),
                                                    supplier_item_id: supplier_item_id
                                                };
                                            })
                                        },
                                        orderBy: {
                                            created_at: 'desc'
                                        }
                                    })];
                            case 2:
                                existingPrices = _f.sent();
                                priceMap = new Map();
                                for (_c = 0, existingPrices_1 = existingPrices; _c < existingPrices_1.length; _c++) {
                                    price = existingPrices_1[_c];
                                    key = price.shop_id + "-" + price.supplier_item_id;
                                    if (!priceMap.has(key)) {
                                        priceMap.set(key, price);
                                    }
                                }
                                dataToInsert = [];
                                for (_d = 0, orderDetails_1 = orderDetails; _d < orderDetails_1.length; _d++) {
                                    _e = orderDetails_1[_d], order = _e.order, detail = _e.detail;
                                    key = order.shop_id + "-" + detail.supplier_item_id;
                                    existingItem = priceMap.get(key);
                                    if (existingItem) {
                                        oldTotalQty = Number(existingItem.total_qty);
                                        oldTotalValue = Number(existingItem.total_value);
                                        newTotalQty = oldTotalQty + Number(detail.final_qty);
                                        newTotalValue = oldTotalValue + Number(detail.price) * Number(detail.final_qty);
                                        newWeightedPrice = newTotalValue / newTotalQty;
                                        dataToInsert.push({
                                            shop_id: order.shop_id,
                                            supplier_item_id: detail.supplier_item_id,
                                            type: 'order_in',
                                            source_order_id: order.id,
                                            source_detail_id: detail.id,
                                            created_at: order.receive_time,
                                            updated_at: order.receive_time,
                                            weighted_price: newWeightedPrice,
                                            total_qty: newTotalQty,
                                            total_value: newTotalValue
                                        });
                                    }
                                    else {
                                        // Create new weighted price
                                        dataToInsert.push({
                                            shop_id: order.shop_id,
                                            supplier_item_id: detail.supplier_item_id,
                                            type: 'order_in',
                                            source_order_id: order.id,
                                            source_detail_id: detail.id,
                                            created_at: order.receive_time,
                                            updated_at: order.receive_time,
                                            weighted_price: detail.price,
                                            total_qty: detail.final_qty,
                                            total_value: Number(detail.price) * Number(detail.final_qty)
                                        });
                                    }
                                }
                                if (!(dataToInsert.length > 0)) return [3 /*break*/, 4];
                                return [4 /*yield*/, imInventory.$transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, tx.shop_item_weighted_price.createMany({
                                                        data: dataToInsert
                                                    })];
                                                case 1:
                                                    _a.sent();
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); })];
                            case 3:
                                _f.sent();
                                _f.label = 4;
                            case 4:
                                skip += batchSize;
                                return [2 /*return*/];
                        }
                    });
                };
                _a.label = 2;
            case 2:
                if (!hasMoreOrders) return [3 /*break*/, 4];
                return [5 /*yield**/, _loop_1()];
            case 3:
                state_1 = _a.sent();
                if (state_1 === "break")
                    return [3 /*break*/, 4];
                return [3 /*break*/, 2];
            case 4: return [4 /*yield*/, imInventory.$disconnect()];
            case 5:
                _a.sent();
                console.log('Processing completed successfully');
                return [2 /*return*/];
        }
    });
}); };
run()["catch"](console.error);
