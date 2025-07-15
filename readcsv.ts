import fs from 'fs';
import path from 'path';

interface OrderData {
  totalPrice: number;
  pgId: string;
  num: number;
  shopName: string;
  letter: string;
  cate: string;
  saleUnit: string;
  reference: string;
  specText: string;
  goods: string;
  address: string;
  filePath: string;
  small: string;
  moniker: string;
  weight: number;
  oldTier: string;
  account: string;
  brand: string;
  gory: string;
  ratio: number;
  [key: string]: any;
}

export class CSVReader {
  private csvPath: string;

  constructor(csvPath: string = '20250715.csv') {
    this.csvPath = csvPath;
  }

  /**
   * Read the CSV file and return raw content
   */
  readRawCSV(): string {
    try {
      const csvContent = fs.readFileSync(this.csvPath, 'utf-8');
      return csvContent;
    } catch (error) {
      console.error('Error reading CSV file:', error);
      throw error;
    }
  }

  /**
   * Parse CSV line into hex data and metadata
   */
  parseCSVLine(line: string): { hexData: string; metadata: number } {
    const parts = line.split(',');
    if (parts.length >= 2) {
      return {
        hexData: parts[0],
        metadata: parseInt(parts[1]) || -1,
      };
    }
    return { hexData: '', metadata: -1 };
  }

  /**
   * Decode hex string to readable text
   */
  decodeHexData(hexString: string): string {
    try {
      // Remove any whitespace
      const cleanHex = hexString.replace(/\s/g, '');

      // Convert hex to buffer then to string
      const buffer = Buffer.from(cleanHex, 'hex');
      return buffer.toString('utf-8');
    } catch (error) {
      console.error('Error decoding hex data:', error);
      return '';
    }
  }

  /**
   * Extract JSON data from decoded text
   */
  extractJSONFromText(text: string): any[] {
    const jsonObjects: any[] = [];

    // Look for JSON-like patterns in the text
    const jsonRegex = /\{[^}]*"totalPrice"[^}]*\}/g;
    const matches = text.match(jsonRegex);

    if (matches) {
      matches.forEach((match) => {
        try {
          // Clean up the JSON string
          const cleanJson = match.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
          const parsedJson = JSON.parse(cleanJson);
          jsonObjects.push(parsedJson);
        } catch (error) {
          // Try to manually parse key-value pairs
          const manualParsed = this.manualParseJSON(match);
          if (manualParsed) {
            jsonObjects.push(manualParsed);
          }
        }
      });
    }

    return jsonObjects;
  }

  /**
   * Manually parse JSON-like strings when JSON.parse fails
   */
  private manualParseJSON(jsonString: string): any {
    try {
      const obj: any = {};

      // Extract common fields using regex
      const patterns = {
        totalPrice: /"totalPrice":\s*([0-9.]+)/,
        pgId: /"pgId":\s*"([^"]+)"/,
        num: /"num":\s*([0-9]+)/,
        shopName: /"shopName":\s*"([^"]+)"/,
        letter: /"letter":\s*"([^"]+)"/,
        cate: /"cate":\s*"([^"]+)"/,
        saleUnit: /"saleUnit":\s*"([^"]+)"/,
        reference: /"reference":\s*"([^"]+)"/,
        specText: /"specText":\s*"([^"]+)"/,
        goods: /"goods":\s*"([^"]+)"/,
        address: /"address":\s*"([^"]+)"/,
        filePath: /"filePath":\s*"([^"]+)"/,
        small: /"small":\s*"([^"]+)"/,
        moniker: /"moniker":\s*"([^"]+)"/,
        weight: /"weight":\s*([0-9.]+)/,
        oldTier: /"oldTier":\s*"([^"]+)"/,
        account: /"account":\s*"([^"]+)"/,
        brand: /"brand":\s*"([^"]+)"/,
        gory: /"gory":\s*"([^"]+)"/,
        ratio: /"ratio":\s*([0-9.]+)/,
      };

      Object.entries(patterns).forEach(([key, pattern]) => {
        const match = jsonString.match(pattern);
        if (match) {
          const value = match[1];
          if (
            key === 'totalPrice' ||
            key === 'num' ||
            key === 'weight' ||
            key === 'ratio'
          ) {
            obj[key] = parseFloat(value);
          } else {
            obj[key] = value;
          }
        }
      });

      return Object.keys(obj).length > 0 ? obj : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Process the entire CSV file and extract all order data
   */
  processCSV(): OrderData[] {
    const rawContent = this.readRawCSV();
    const lines = rawContent.split('\n').filter((line) => line.trim());

    const allOrders: OrderData[] = [];

    lines.forEach((line, index) => {
      try {
        const { hexData } = this.parseCSVLine(line);

        if (hexData) {
          const decodedText = this.decodeHexData(hexData);
          const jsonObjects = this.extractJSONFromText(decodedText);

          jsonObjects.forEach((obj) => {
            allOrders.push(obj as OrderData);
          });
        }
      } catch (error) {
        console.error(`Error processing line ${index + 1}:`, error);
      }
    });

    return allOrders;
  }

  /**
   * Get summary statistics of the processed data
   */
  getSummary(orders: OrderData[]): any {
    if (orders.length === 0) {
      return { message: 'No orders found' };
    }

    const totalOrders = orders.length;
    const totalPrice = orders.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0
    );
    const avgPrice = totalPrice / totalOrders;

    const shops = [...new Set(orders.map((order) => order.shopName))];
    const categories = [...new Set(orders.map((order) => order.cate))];

    return {
      totalOrders,
      totalPrice,
      avgPrice,
      uniqueShops: shops.length,
      uniqueCategories: categories.length,
      shops,
      categories,
    };
  }
}

// Usage example
if (require.main === module) {
  const csvReader = new CSVReader();

  try {
    console.log('Reading CSV file...');
    const orders = csvReader.processCSV();

    console.log(`\nProcessed ${orders.length} orders`);

    // Display first few orders
    console.log('\nFirst 3 orders:');
    orders.slice(0, 3).forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`);
      console.log(`- Total Price: ${order.totalPrice}`);
      console.log(`- Shop: ${order.shopName}`);
      console.log(`- Category: ${order.cate}`);
      console.log(`- Goods: ${order.goods}`);
      console.log(`- Number: ${order.num}`);
    });

    // Display summary
    const summary = csvReader.getSummary(orders);
    console.log('\nSummary:');
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}
