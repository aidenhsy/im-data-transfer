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

  const missingLedger = procurementBills.filter(
    (bill) => !ledger.some((ledger) => ledger.source_id === bill.id)
  );

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

run();
