export const orderType = (type: number) => {
  switch (type) {
    case 1:
      return '临时订单';
    case 3:
      return '三点订单';
    case 9:
      return '九点订单';
    default:
      return '未知';
  }
};

export const orderStatus = (status: number) => {
  switch (status) {
    case 0:
      return '待供应商接单';
    case 1:
      return '供应商以接单 待送货';
    case 2:
      return '货以送达 待确认';
    case 3:
      return '以发货，配送中';
    case 4:
      return '已收货, 无纠纷, 订单完成';
    case 5:
      return '纠纷以解决，订单完成';
    case 20:
      return '收货跟送货数量不一致待供应商确认';
    case 40:
      return '供应商拒接接单';
    case 99:
      return '待发给供应商';
    default:
      return '未知';
  }
};

export const wacType = (type: string) => {
  switch (type) {
    case 'stock_count':
      return '盘点';
    case 'order_in':
      return '采购入库';
    default:
      return '未知';
  }
};
