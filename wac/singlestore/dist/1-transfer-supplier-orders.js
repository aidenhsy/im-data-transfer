"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
exports.__esModule = true;
var im_inventory_prod_1 = require("../../prisma/clients/im-inventory-prod");
var im_procurement_prod_1 = require("../../prisma/clients/im-procurement-prod");
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    var imInventory, imProcurement, shopId, supplierOrders, _loop_1, _i, supplierOrders_1, supplierOrder;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                imInventory = new im_inventory_prod_1.PrismaClient();
                imProcurement = new im_procurement_prod_1.PrismaClient();
                shopId = 32;
                return [4 /*yield*/, imInventory.supplier_order_details.deleteMany({
                        where: {
                            supplier_orders: {
                                shop_id: shopId
                            }
                        }
                    })];
            case 1:
                _a.sent();
                return [4 /*yield*/, imInventory.supplier_orders.deleteMany({
                        where: {
                            shop_id: shopId
                        }
                    })];
            case 2:
                _a.sent();
                return [4 /*yield*/, imProcurement.supplier_orders.findMany({
                        where: {
                            shop_id: shopId,
                            status: {
                                "in": [4, 5]
                            }
                        },
                        include: {
                            supplier_order_details: true
                        }
                    })];
            case 3:
                supplierOrders = _a.sent();
                _loop_1 = function (supplierOrder) {
                    var supplier_order_details, rest;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                supplier_order_details = supplierOrder.supplier_order_details, rest = __rest(supplierOrder, ["supplier_order_details"]);
                                return [4 /*yield*/, imInventory.supplier_orders.create({
                                        data: __assign({}, rest)
                                    })];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, imInventory.supplier_order_details.createMany({
                                        data: supplier_order_details.map(function (detail) {
                                            var total_final_amount = detail.total_final_amount, total_order_amount = detail.total_order_amount, rest = __rest(detail, ["total_final_amount", "total_order_amount"]);
                                            return __assign(__assign({}, rest), { order_id: supplierOrder.id });
                                        })
                                    })];
                            case 2:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                };
                _i = 0, supplierOrders_1 = supplierOrders;
                _a.label = 4;
            case 4:
                if (!(_i < supplierOrders_1.length)) return [3 /*break*/, 7];
                supplierOrder = supplierOrders_1[_i];
                return [5 /*yield**/, _loop_1(supplierOrder)];
            case 5:
                _a.sent();
                _a.label = 6;
            case 6:
                _i++;
                return [3 /*break*/, 4];
            case 7: return [2 /*return*/];
        }
    });
}); };
run();
