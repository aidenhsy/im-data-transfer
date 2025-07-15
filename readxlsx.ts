import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { PrismaClient as IM } from './prisma/clients/im-prod';
import { PrismaClient as IMProcurement } from './prisma/clients/im-procurement-prod';
import { PrismaClient as Scm } from './prisma/clients/scm-prod';
import { PrismaClient as ScmPricing } from './prisma/clients/scm-pricing-prod';
import { PrismaClient as IMProcurementDev } from './prisma/clients/im-procurement-dev';

// Interface for Excel row data
interface ExcelRow {
  [key: string]: any;
}

// Interface for Excel sheet data
interface ExcelSheet {
  name: string;
  data: ExcelRow[];
}

// Interface for Excel workbook data
interface ExcelWorkbook {
  sheets: ExcelSheet[];
}

/**
 * Read Excel file and return workbook data
 * @param filePath Path to the Excel file
 * @returns Promise containing workbook data
 */
export async function readExcelFile(filePath: string): Promise<ExcelWorkbook> {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read the file
    const workbook = XLSX.readFile(filePath);

    // Process all sheets
    const sheets: ExcelSheet[] = workbook.SheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Use first row as headers
        defval: null, // Default value for empty cells
        raw: false, // Parse values as strings
      });

      // Convert array of arrays to array of objects
      const headers = data[0] as string[];
      const rows = data.slice(1).map((row) => {
        const rowObj: ExcelRow = {};
        headers.forEach((header, index) => {
          rowObj[header] = row[index] || null;
        });
        return rowObj;
      });

      return {
        name: sheetName,
        data: rows,
      };
    });

    return { sheets };
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
}

/**
 * Read specific sheet from Excel file
 * @param filePath Path to the Excel file
 * @param sheetName Name of the sheet to read
 * @returns Promise containing sheet data
 */
export async function readExcelSheet(
  filePath: string,
  sheetName: string
): Promise<ExcelRow[]> {
  try {
    const workbook = await readExcelFile(filePath);
    const sheet = workbook.sheets.find((s) => s.name === sheetName);

    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found in file: ${filePath}`);
    }

    return sheet.data;
  } catch (error) {
    console.error('Error reading Excel sheet:', error);
    throw error;
  }
}

/**
 * Get all sheet names from Excel file
 * @param filePath Path to the Excel file
 * @returns Promise containing array of sheet names
 */
export async function getExcelSheetNames(filePath: string): Promise<string[]> {
  try {
    const workbook = XLSX.readFile(filePath);
    return workbook.SheetNames;
  } catch (error) {
    console.error('Error getting sheet names:', error);
    throw error;
  }
}

/**
 * Read Excel file and return data as CSV-like format
 * @param filePath Path to the Excel file
 * @param sheetName Optional sheet name (defaults to first sheet)
 * @returns Promise containing CSV-like data
 */
export async function readExcelAsCSV(
  filePath: string,
  sheetName?: string
): Promise<string[][]> {
  try {
    const workbook = XLSX.readFile(filePath);
    const targetSheet = sheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[targetSheet];

    return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  } catch (error) {
    console.error('Error reading Excel as CSV:', error);
    throw error;
  }
}

// Example usage function
const run = async () => {
  const imProcurementDev = new IMProcurementDev();
  // Read tp.xlsx file
  const tpData = await readExcelFile('./tp.xlsx');
  const sheet1 = tpData.sheets[1];

  // Prepare data for bulk insert
  const recordsToInsert = sheet1.data.map((row) => ({
    id: row.id,
    store_name: row['店名'],
    delivery_date: row['送货日期'],
    good_id: row['产品id'],
    good_name: row['产品名称'],
    order_qty: row['送货数量'],
    price: row['金额'],
    good_price: row['加权平均成本价'],
  }));

  console.log(`Inserting ${recordsToInsert.length} records...`);

  // Bulk insert all records at once
  await imProcurementDev.old_records.createMany({
    data: recordsToInsert,
  });

  console.log(`Successfully inserted ${recordsToInsert.length} records!`);
};

run();
