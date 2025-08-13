import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

import { PrismaClient as ScmProd } from '../prisma/clients/scm-prod';
import { PrismaClient as ScmOrder } from '../prisma/clients/scm-order-prod';
import { PrismaClient as ImProcurement } from '../prisma/clients/im-procurement-prod';

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
async function readExcelFile(filePath: string): Promise<ExcelWorkbook> {
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
 * Get all sheet names from Excel file
 * @param filePath Path to the Excel file
 * @returns Promise containing array of sheet names
 */
async function getExcelSheetNames(filePath: string): Promise<string[]> {
  try {
    const workbook = XLSX.readFile(filePath);
    return workbook.SheetNames;
  } catch (error) {
    console.error('Error getting sheet names:', error);
    throw error;
  }
}

/**
 * Script to read xxx.xlsx file and console log each row
 */
async function readAndLogXxxFile() {
  const scm = new ScmProd();
  const imProcurement = new ImProcurement();
  const scmOrder = new ScmOrder();

  try {
    // Path to the xxx.xlsx file
    const filePath = path.join(__dirname, 'xxx.xlsx');

    console.log('📖 Reading xxx.xlsx file...');
    console.log('File path:', filePath);
    console.log('='.repeat(50));

    // Get all sheet names first
    const sheetNames = await getExcelSheetNames(filePath);
    console.log('📋 Available sheets:', sheetNames);
    console.log('='.repeat(50));

    // Read the entire workbook
    const workbook = await readExcelFile(filePath);

    // Process each sheet
    for (const sheet of workbook.sheets) {
      console.log(`\n📄 Sheet: "${sheet.name}"`);
      console.log('-'.repeat(30));

      if (sheet.data.length === 0) {
        console.log('⚠️  Sheet is empty');
        continue;
      }

      console.log(`📊 Total rows: ${sheet.data.length}`);

      // Log headers if available
      if (sheet.data.length > 0) {
        const headers = Object.keys(sheet.data[0]);
        console.log('📝 Headers:', headers.join(', '));
        console.log('-'.repeat(30));
      }

      // Log each row with only specific fields
      for (let index = 0; index < sheet.data.length; index++) {
        const row = sheet.data[index];
        console.log(`\n🔸 Row ${index + 1}:`);

        // Only log the specific fields requested
        const fieldsToLog = [
          'orderid',
          'detailid',
          'order_qty',
          'sent_qty',
          'receive_qty',
          'final_qty',
        ];

        // Extract values from row
        const orderid = row['orderid'];
        const detailid = row['detailid'];
        const order_qty = row['order_qty'];
        const sent_qty = row['sent_qty'];
        const receive_qty = row['receive_qty'];
        const final_qty = row['final_qty'];

        // Log the fields
        fieldsToLog.forEach((field) => {
          const value = row[field];
          console.log(`  ${field}: ${value}`);
        });

        console.log(
          `orderid: ${orderid}\ndetailid: ${detailid}\norder_qty: ${order_qty}\nsent_qty: ${sent_qty}\nreceive_qty: ${receive_qty}\nfinal_qty: ${final_qty}`
        );

        // Query database for order detail if detailid exists
        if (detailid) {
          try {
            const orderDetail =
              await scmOrder.procurement_order_details.findFirst({
                where: {
                  id: detailid,
                },
                include: {
                  procurement_orders: true,
                },
              });

            if (orderDetail) {
              const procurementOrderDetail =
                await imProcurement.supplier_order_details.findFirst({
                  where: {
                    order_id: orderDetail.procurement_orders.client_order_id!,
                    supplier_reference_id: orderDetail.reference_id!,
                  },
                });

              if (!procurementOrderDetail) {
                console.log(
                  `  ⚠️  No procurement order detail found for detailid: ${detailid}`
                );
                continue;
              }
              const scmProdDetail = await scm.scm_order_details.findFirst({
                where: {
                  reference_id: orderDetail.reference_id!,
                  reference_order_id: procurementOrderDetail.order_id,
                },
              });

              if (!scmProdDetail) {
                console.log(
                  `  ⚠️  No scm order detail found for detailid: ${detailid}`
                );
                continue;
              }

              console.log(
                `scm id: ${scmProdDetail.id}\norder id: ${orderDetail.id}\nprocurement: ${procurementOrderDetail.id}`
              );
              await scm.scm_order_details.update({
                where: {
                  id: scmProdDetail.id,
                },
                data: {
                  deliver_goods_qty: sent_qty,
                  delivery_qty: final_qty,
                },
              });
              await scmOrder.procurement_order_details.update({
                where: {
                  id: orderDetail.id,
                },
                data: {
                  order_qty: order_qty,
                  deliver_qty: sent_qty,
                  customer_receive_qty: receive_qty,
                  final_qty: final_qty,
                },
              });
              await imProcurement.supplier_order_details.update({
                where: {
                  id: procurementOrderDetail.id,
                },
                data: {
                  order_qty: order_qty,
                  actual_delivery_qty: sent_qty,
                  confirm_delivery_qty: receive_qty,
                  final_qty: final_qty,
                },
              });
            } else {
              console.log(
                `  ⚠️  No order detail found for detailid: ${detailid}`
              );
            }
          } catch (dbError) {
            console.error(
              `  ❌ Database error for detailid ${detailid}:`,
              dbError
            );
          }
        }
      }

      console.log('\n' + '='.repeat(50));
    }
  } catch (error) {
    console.error('❌ Error reading xxx.xlsx file:', error);
    process.exit(1);
  } finally {
    // Close database connections
    await scm.$disconnect();
    await imProcurement.$disconnect();
    await scmOrder.$disconnect();
  }
}

// Run the script
readAndLogXxxFile();
