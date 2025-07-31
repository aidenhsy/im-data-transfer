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
    var imInventory, batchSize, skip, hasMoreOrders, orders, _i, orders_1, order, _a, _b, detail, item, oldTotalQty, oldTotalValue, newTotalQty, newTotaValue, newWeightedPrice;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                imInventory = new im_inventory_prod_1.PrismaClient();
                batchSize = 100;
                skip = 0;
                hasMoreOrders = true;
                _c.label = 1;
            case 1:
                if (!hasMoreOrders) return [3 /*break*/, 12];
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
                        }
                    })];
            case 2:
                orders = _c.sent();
                if (orders.length < batchSize) {
                    hasMoreOrders = false;
                }
                if (orders.length === 0) {
                    return [3 /*break*/, 12];
                }
                _i = 0, orders_1 = orders;
                _c.label = 3;
            case 3:
                if (!(_i < orders_1.length)) return [3 /*break*/, 11];
                order = orders_1[_i];
                _a = 0, _b = order.supplier_order_details;
                _c.label = 4;
            case 4:
                if (!(_a < _b.length)) return [3 /*break*/, 10];
                detail = _b[_a];
                return [4 /*yield*/, imInventory.shop_item_weighted_price.findFirst({
                        where: {
                            shop_id: order.shop_id,
                            supplier_item_id: detail.supplier_item_id
                        },
                        orderBy: {
                            created_at: 'desc'
                        }
                    })];
            case 5:
                item = _c.sent();
                if (!item) return [3 /*break*/, 7];
                oldTotalQty = item.total_qty;
                oldTotalValue = item.total_value;
                newTotalQty = Number(oldTotalQty) + Number(detail.final_qty);
                newTotaValue = Number(oldTotalValue) +
                    Number(detail.price) * Number(detail.final_qty);
                newWeightedPrice = newTotaValue / newTotalQty;
                return [4 /*yield*/, imInventory.shop_item_weighted_price.create({
                        data: {
                            shop_id: order.shop_id,
                            supplier_item_id: detail.supplier_item_id,
                            type: 'order_in',
                            source_order_id: order.id,
                            source_detail_id: detail.id,
                            created_at: order.receive_time,
                            updated_at: order.receive_time,
                            weighted_price: newWeightedPrice,
                            total_qty: newTotalQty,
                            total_value: newTotaValue
                        }
                    })];
            case 6:
                _c.sent();
                _c.label = 7;
            case 7: return [4 /*yield*/, imInventory.shop_item_weighted_price.create({
                    data: {
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
                    }
                })];
            case 8:
                _c.sent();
                _c.label = 9;
            case 9:
                _a++;
                return [3 /*break*/, 4];
            case 10:
                _i++;
                return [3 /*break*/, 3];
            case 11:
                skip += batchSize;
                return [3 /*break*/, 1];
            case 12: return [2 /*return*/];
        }
    });
}); };
run();
