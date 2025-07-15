import { createClient } from 'redis';

// TypeScript interface for the order item data
interface OrderItem {
  totalPrice: number;
  pgId: string;
  num: number;
  shopName: string;
  letterName: string;
  cateName: string;
  saleUnit: string;
  referenceId: string;
  sid: string;
  price: number;
  shopId: number;
  specText: string;
  goodsName: string;
  address: string;
  filePath: string;
  smallUnit: string;
  moniker: string;
  weighing: number;
  soldTime: string;
  accountId: number;
  createTime: string;
  cateId: number;
  brandId: number;
  categoryId: number;
  ratio: number;
}

const redisClient = createClient({
  socket: {
    host: 'r-j6cmc31ieymi0w8s39pd.redis.rds.aliyuncs.com',
    port: 6379,
  },
  password: 'Jones88888!',
});

async function connectToRedis() {
  try {
    await redisClient.connect();
    console.log('Connected to Redis successfully!');

    // Test the connection - get list data

    const listValues = await redisClient.lRange('card_1351111111111111', 0, -1);

    // Parse JSON strings into objects
    const parsedData: OrderItem[] = listValues
      .map((item, index) => {
        try {
          return JSON.parse(item);
        } catch (error) {
          console.error(`Error parsing item ${index}:`, error);
          return null;
        }
      })
      .filter((item) => item !== null);

    console.log(parsedData[0]);
    process.exit(0);
  } catch (error) {
    console.error('Redis connection error:', error);
  }
}

// Handle connection events
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis client connected');
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

// Connect to Redis
connectToRedis();

// Export the client for use in other modules
export default redisClient;
