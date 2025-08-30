import excel from 'exceljs';
import path from 'path';
import { DatabaseService } from '../database';

async function main() {
  const database = new DatabaseService();

  const workbook = new excel.Workbook();
  const filePath = path.resolve(__dirname, 'sync.xlsx');

  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet('sync');
  if (!worksheet) {
    console.error("Worksheet named 'sync' not found");
    process.exit(1);
  }

  const totalRows = worksheet.rowCount;
  const totalCols = worksheet.columnCount;

  const data: Array<Array<unknown>> = [];
  for (let r = 2; r <= totalRows; r += 1) {
    const rowValues: Array<unknown> = [];
    const row = worksheet.getRow(r);
    for (let c = 1; c <= totalCols; c += 1) {
      const value = row.getCell(c).value ?? null;
      rowValues.push(value);
    }
    data.push(rowValues);
  }

  const nonEmptyRows = data.filter((row) =>
    row.some((value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    })
  );

  type SyncRow = {
    order_id: unknown;
    reference_id: unknown;
    qty: unknown;
  };

  const mapped: SyncRow[] = nonEmptyRows.map((row) => ({
    order_id: row[0] ?? null,
    reference_id: row[2] ?? null,
    qty: row[19] ?? null,
  }));

  for (const row of mapped) {
    console.log(row.reference_id, row.order_id);
    const bDetail = await database.scmProd.scm_order_details.findFirst({
      where: {
        reference_id: row.reference_id as string,
        reference_order_id: row.order_id as string,
      },
    });
    if (!bDetail) {
      console.log(row.reference_id, row.order_id, '!!! not found');
      continue;
    }
    const oDetail =
      await database.scmOrderProd.procurement_order_details.findFirst({
        where: {
          reference_id: row.reference_id as string,
          procurement_orders: {
            client_order_id: row.order_id as string,
          },
        },
      });

    if (!oDetail) {
      console.log(row.reference_id, row.order_id, '!!! not found');
      continue;
    }

    await database.scmOrderProd.procurement_order_details.update({
      where: {
        id: oDetail.id,
      },
      data: {
        final_qty: Number(row.qty),
      },
    });

    await database.scmProd.scm_order_details.update({
      where: {
        id: bDetail.id,
      },
      data: {
        delivery_qty: Number(row.qty),
      },
    });

    await database.imProcurementProd.supplier_order_details.update({
      where: {
        supplier_reference_id_order_id: {
          order_id: row.order_id as string,
          supplier_reference_id: row.reference_id as string,
        },
      },
      data: {
        final_qty: Number(row.qty),
      },
    });
  }
}

main();
