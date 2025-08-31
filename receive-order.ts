import { DatabaseService } from './database';

const run = async (aggregateId: string) => {
  const databaseService = new DatabaseService();

  const order =
    await databaseService.imProcurementProd.supplier_orders.findUnique({
      where: {
        id: aggregateId,
      },
      include: {
        supplier_order_details: true,
      },
    });

  if (!order) {
    console.log(`Order ${aggregateId} not found`);
    return;
  }
  const orderDetails =
    await databaseService.scmOrderProd.procurement_order_details.findMany({
      where: {
        procurement_orders: {
          client_order_id: order.id,
        },
      },
      select: {
        id: true,
        deliver_qty: true,
        reference_id: true,
      },
    });
  const scmDetails = await databaseService.scmProd.scm_order_details.findMany({
    where: {
      reference_order_id: order.id,
    },
    select: {
      reference_id: true,
      delivery_qty: true,
    },
  });
  if (
    orderDetails.length !== order.supplier_order_details.length ||
    scmDetails.length !== order.supplier_order_details.length
  ) {
    console.log(`Order ${aggregateId} has mismatched details`, {
      orderDetails: orderDetails.length,
      scmDetails: scmDetails.length,
      supplierDetails: order.supplier_order_details.length,
    });
    return;
  }
  const orderMap = new Map<string, any>(
    orderDetails.map((o) => [o.reference_id, o]) as [string, any][]
  );
  const scmMap = new Map<string, any>(
    scmDetails.map((o) => [o.reference_id, o]) as [string, any][]
  );

  for (const detail of order.supplier_order_details) {
    const orderDetail = orderMap.get(detail.supplier_reference_id);
    const scmDetail = scmMap.get(detail.supplier_reference_id);

    if (
      Number(detail.confirm_delivery_qty) === Number(orderDetail.deliver_qty) &&
      Number(detail.confirm_delivery_qty) === Number(scmDetail.delivery_qty) &&
      Number(detail.actual_delivery_qty) === Number(scmDetail.delivery_qty)
    ) {
      await databaseService.scmOrderProd.procurement_order_details.update({
        where: {
          id: orderDetail.id,
        },
        data: {
          final_qty: detail.confirm_delivery_qty,
        },
      });
      await databaseService.imProcurementProd.supplier_order_details.update({
        where: {
          id: detail.id,
        },
        data: {
          final_qty: detail.confirm_delivery_qty,
        },
      });
      await databaseService.scmOrderProd.procurement_orders.update({
        where: {
          client_order_id: order.id,
        },
        data: {
          status: 4,
        },
      });
      await databaseService.imProcurementProd.supplier_orders.update({
        where: {
          id: order.id,
        },
        data: {
          status: 4,
        },
      });
      console.log(`Order ${aggregateId} finished`);
    } else {
      console.log(`Order ${aggregateId} has mismatched details`);
    }
  }
};

const runDetail = async () => {
  const databaseService = new DatabaseService();

  const orders =
    await databaseService.imProcurementProd.supplier_orders.findMany({
      where: {
        created_at: {
          gt: new Date('2025-08-30T00:00:00.000Z'),
          lt: new Date('2025-08-30T23:59:59.999Z'),
        },
      },
      include: {
        supplier_order_details: true,
      },
    });
};

const runBatch = async () => {
  const databaseService = new DatabaseService();
  console.log('runBatch');

  const orders =
    await databaseService.imProcurementProd.supplier_orders.findMany({
      where: {
        created_at: {
          gt: new Date('2025-08-30T00:00:00.000Z'),
          lt: new Date('2025-08-30T23:59:59.999Z'),
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

  console.log(orders.length);

  console.log(orders.map((o) => `'${o.id}'`).join(','));

  // for (const order of orders) {
  //   if (order.status !== 4) {
  //     await run(order.id);
  //   }
  // }
};
runBatch();
