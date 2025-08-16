import excel from 'exceljs';
import path from 'path';
import { PrismaClient as ImBasicData } from '../prisma/clients/im-basic-data-prod';
import { PrismaClient as ImProcurement } from '../prisma/clients/im-procurement-prod';

async function main() {
  const imBasicDataDB = new ImBasicData();
  const imProcurementDB = new ImProcurement();

  const workbook = new excel.Workbook();
  const filePath = path.resolve(__dirname, 'process.xlsx');

  await workbook.xlsx.readFile(filePath);

  const sheetCount = workbook.worksheets.length;
  console.log(`Sheet count: ${sheetCount}`);
  console.log(
    'Sheets:',
    workbook.worksheets.map((ws) => ws.name)
  );

  const worksheet = workbook.getWorksheet('special');
  if (!worksheet) {
    console.error("Worksheet named 'special' not found");
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

  type SpecialRow = {
    item_id: unknown;
    item_name: unknown;
    plan_name: unknown;
    shop_name: unknown;
    supplier_item_id: unknown;
    supply_item_name: unknown;
    is_special: unknown;
  };

  const nonEmptyRows = data.filter((row) =>
    row.some((value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    })
  );

  const mapped: SpecialRow[] = nonEmptyRows.map((row) => ({
    item_id: row[0] ?? null,
    item_name: row[1] ?? null,
    plan_name: row[2] ?? null,
    shop_name: row[3] ?? null,
    supplier_item_id: row[4] ?? null,
    supply_item_name: row[5] ?? null,
    is_special: row[6] ?? null,
  }));

  for (const row of mapped) {
    if (row.is_special === 1) {
      console.log(row);
    }
  }
}

main().catch((error) => {
  console.error('Failed to read workbook:', error);
  process.exit(1);
});
