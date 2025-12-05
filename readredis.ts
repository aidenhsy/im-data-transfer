import { createClient } from 'redis';
import { DatabaseService } from './database';

const redisClient = createClient({
  socket: {
    host: '47.242.114.49',
    port: 6379,
  },
  password: 'Jones88888!',
});

async function connectToRedis() {
  const database = new DatabaseService();
  try {
    await redisClient.connect();
    console.log('Connected to Redis successfully!');

    // List all keys and get JSON values
    const keys = await redisClient.keys('*');
    for (const key of keys) {
      const value: any = await redisClient.json.get(key);
      if (value.items.length > 0) {
        for (const item of value.items) {
          console.log(item.reference_id);
          const newReferenceId = item.reference_id.replace(
            '20251204-',
            '20251205-'
          );
          const pricing =
            await database.scmPricingProd.scm_good_pricing.findFirst({
              where: {
                external_reference_id: newReferenceId,
              },
            });
          if (!pricing) {
            console.log(newReferenceId, 'no pricing');
            continue;
          }
          console.log(item.price);
        }
      }
    }

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
