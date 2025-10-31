import { DatabaseService } from './database';

const run = async () => {
  const database = new DatabaseService();

  const ledger = await database.imAccountingProd.inventory_ledger_bill.findMany(
    {
      where: {
        created_at: {
          gte: new Date('2025-10-01T00:00:00.000Z'),
        },
        biz_type_id: 1,
      },
      select: {
        id: true,
        source_id: true,
      },
    }
  );

  console.log('ledger', ledger.length);

  const procurementBills =
    await database.imProcurementProd.supplier_orders.findMany({
      select: {
        id: true,
      },
      where: {
        status: 4,
        receive_time: {
          gte: new Date('2025-10-01T00:00:00.000Z'),
        },
      },
    });
  console.log('procurementBills', procurementBills.length);

  const missingLedger = procurementBills.filter(
    (bill) => !ledger.some((ledger) => ledger.source_id === bill.id)
  );

  const missingBillIds = ledger.filter(
    (ledger) => !procurementBills.some((bill) => bill.id === ledger.source_id)
  );
  if (missingBillIds.length > 0) {
    console.log(
      'missingBillIds',
      missingBillIds.map((ledger) => ledger.id)
    );
  }

  if (missingLedger.length > 0) {
    for (const ledger of missingLedger) {
      const procurementBill =
        await database.imProcurementProd.supplier_orders.findFirst({
          where: {
            id: ledger.id,
          },
          include: {
            scm_shop: true,
            supplier_order_details: {
              include: {
                supplier_items: true,
                stock_category: true,
                generic_items: {
                  include: {
                    scm_goods_category: true,
                    standard_units: true,
                  },
                },
              },
            },
          },
        });

      console.log(procurementBill?.id);
      if (!procurementBill) {
        continue;
      }

      const storageLocations =
        await database.imAccountingProd.storage_locations.findMany({
          where: {
            shop_id: Number(procurementBill.shop_id),
          },
          select: {
            id: true,
            storage_code: true,
          },
        });

      const newBill =
        await database.imAccountingProd.inventory_ledger_bill.create({
          data: {
            biz_type_bill_id: 1,
            biz_type_id: 1,
            source_id: procurementBill.id,
            shop_id: procurementBill.shop_id,
            brand_id: procurementBill.scm_shop.brand_id,
            org_id: 1,
            created_at: procurementBill.receive_time!,
          },
        });

      for (const detail of procurementBill.supplier_order_details) {
        const storageLocation = storageLocations.find(
          (storage) =>
            storage.storage_code ===
            Number(`${procurementBill.shop_id}0000${detail.stock_category_id}`)
        );

        await database.imAccountingProd.inventory_ledger.create({
          data: {
            biz_type_id: 1,
            source_id: procurementBill.id,
            source_detail_id: detail.id,
            shop_id: procurementBill.shop_id,
            brand_id: procurementBill.scm_shop.brand_id,
            org_id: 1,
            supplier_item_id: detail.supplier_item_id!,
            supplier_item_name: detail.supplier_items?.name!,
            generic_item_id: detail.item_id,
            generic_item_name: detail.generic_items?.name!,
            category_id: detail.generic_items?.category_id!,
            category_name: detail.generic_items?.scm_goods_category?.name!,
            stock_id: detail.stock_category_id,
            stock_name: detail.stock_category?.name,
            base_unit_qty:
              Number(detail.actual_delivery_qty) *
              Number(detail.package_unit_to_base_ratio),
            base_unit: detail.generic_items.standard_units?.name!,
            package_unit_qty: Number(detail.actual_delivery_qty),
            package_unit: detail.package_unit_name,
            price: Number(detail.price),
            total_value: detail.total_delivery_amount!,
            created_at: procurementBill.receive_time!,
            storage_location_id: storageLocation?.id,
            other_side_id: '1',
            other_side_name: '星晴供应链',
            other_side_type: '供应商',
            bill_id: newBill.id,
            biz_type_bill_id: 1,
          },
        });
      }
    }
  }
};

const runReturn = async () => {
  const database = new DatabaseService();

  const returns =
    await database.imProcurementProd.supplier_order_returns.findMany({
      where: {
        status: 1,
        supplier_orders: {
          receive_time: {
            gte: new Date('2025-10-01T00:00:00.000Z'),
          },
        },
      },
      select: {
        id: true,
      },
    });

  const returnBills =
    await database.imAccountingProd.inventory_ledger_bill.findMany({
      where: {
        biz_type_id: 2,
        created_at: {
          gte: new Date('2025-10-01T00:00:00.000Z'),
        },
      },
    });

  console.log('returnDetails', returns.length);
  console.log('returnBills', returnBills.length);

  if (returnBills.length < returns.length) {
    console.log('returnBills < returns');
    const missingReturnIds = returns
      .filter(
        (returnItem) =>
          !returnBills.some((bill) => bill.source_id === returnItem.id)
      )
      .map((returnItem) => returnItem.id);

    for (const returnId of missingReturnIds) {
      const returnItem =
        await database.imProcurementProd.supplier_order_returns.findFirst({
          where: {
            id: returnId,
          },
          include: {
            scm_shop: true,
            supplier_order_return_details: {
              where: {
                status: 1,
              },
              include: {
                supplier_order_details: {
                  include: {
                    supplier_items: true,
                    stock_category: true,
                    generic_items: {
                      include: {
                        scm_goods_category: true,
                        standard_units: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

      if (!returnItem) {
        continue;
      }
      if (returnItem.supplier_order_return_details.length === 0) {
        continue;
      }
      console.log(returnItem.id);

      const storageLocations =
        await database.imAccountingProd.storage_locations.findMany({
          where: {
            shop_id: Number(returnItem.scm_shop.id),
          },
          select: {
            id: true,
            storage_code: true,
          },
        });

      const newBill =
        await database.imAccountingProd.inventory_ledger_bill.create({
          data: {
            biz_type_bill_id: 2,
            biz_type_id: 2,
            source_id: returnItem.id,
            shop_id: returnItem.scm_shop.id,
            brand_id: returnItem.scm_shop.brand_id,
            org_id: 1,
            created_at: returnItem.created_at!,
          },
        });

      for (const detail of returnItem.supplier_order_return_details) {
        const storageLocation = storageLocations.find(
          (storage) =>
            storage.storage_code ===
            Number(
              `${returnItem.scm_shop.id}0000${detail.supplier_order_details.stock_category_id}`
            )
        );

        await database.imAccountingProd.inventory_ledger.create({
          data: {
            biz_type_id: 2,
            source_id: returnItem.id,
            source_detail_id: detail.id,
            shop_id: returnItem.scm_shop.id,
            brand_id: returnItem.scm_shop.brand_id,
            org_id: 1,
            supplier_item_id: detail.supplier_order_details.supplier_item_id!,
            supplier_item_name:
              detail.supplier_order_details.supplier_items?.name!,
            generic_item_id: detail.supplier_order_details.generic_items.id,
            generic_item_name: detail.supplier_order_details.generic_items.name,
            category_id:
              detail.supplier_order_details.generic_items.category_id,
            category_name:
              detail.supplier_order_details.generic_items.scm_goods_category
                .name,
            stock_id: detail.supplier_order_details.stock_category_id,
            stock_name: detail.supplier_order_details.stock_category?.name,
            base_unit_qty:
              -Number(detail.qty_returned) *
              Number(detail.supplier_order_details.package_unit_to_base_ratio),
            base_unit: detail.supplier_order_details.package_unit_name,
            package_unit_qty: -Number(detail.qty_returned),
            package_unit: detail.supplier_order_details.package_unit_name,
            price: Number(detail.unit_price),
            total_value: -Number(detail.total_value!),
            created_at: returnItem.created_at!,
            storage_location_id: storageLocation?.id,
            other_side_id: '1',
            other_side_name: '星晴供应链',
            other_side_type: '供应商',
            bill_id: newBill.id,
            biz_type_bill_id: 2,
          },
        });
      }
    }
  }
};

const main = async () => {
  const arg = process.argv[2]; // e.g. "run" or "return"
  if (arg === 'orderin') {
    await run();
  } else if (arg === 'return') {
    await runReturn();
  } else {
    console.error('Usage: ts-node script.ts [run|return]');
    process.exit(1);
  }
};

main();
