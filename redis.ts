import { createClient } from 'redis';
import { DatabaseService } from './database';
import dotenv from 'dotenv';

dotenv.config();

class RedisConnection {
  private client: any;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://47.242.114.49:6379',
      password: process.env.REDIS_PASSWORD || 'Jones88888!',
    });

    this.client.on('error', (err: any) =>
      console.error('Redis Client Error', err)
    );
    this.client.on('connect', () => console.log('Connected to Redis'));
    this.client.on('ready', () => console.log('Redis client ready'));
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('Redis connection established successfully');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.client.disconnect();
      console.log('Disconnected from Redis');
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }

  async getKey(key: string) {
    try {
      const value = await this.client.get(key);
      console.log(`Value for key "${key}":`, value);
      return value;
    } catch (error) {
      console.error(`Error getting key "${key}":`, error);
      throw error;
    }
  }

  async setKey(key: string, value: string) {
    try {
      await this.client.set(key, value);
      console.log(`Successfully set key "${key}" with value "${value}"`);
    } catch (error) {
      console.error(`Error setting key "${key}":`, error);
      throw error;
    }
  }

  async getAllKeys(pattern: string = '*') {
    try {
      const keys = await this.client.keys(pattern);
      return keys;
    } catch (error) {
      console.error(`Error getting keys with pattern "${pattern}":`, error);
      throw error;
    }
  }

  async getMultipleKeys(keys: string[]) {
    try {
      const values = await this.client.mGet(keys);
      const result = keys.reduce((acc, key, index) => {
        acc[key] = values[index];
        return acc;
      }, {} as Record<string, string>);

      return result;
    } catch (error) {
      console.error('Error getting multiple keys:', error);
      throw error;
    }
  }

  async exists(key: string) {
    try {
      const exists = await this.client.exists(key);
      console.log(`Key "${key}" exists:`, Boolean(exists));
      return Boolean(exists);
    } catch (error) {
      console.error(`Error checking if key "${key}" exists:`, error);
      throw error;
    }
  }

  async deleteKey(key: string) {
    try {
      const result = await this.client.del(key);
      console.log(`Deleted key "${key}":`, Boolean(result));
      return Boolean(result);
    } catch (error) {
      console.error(`Error deleting key "${key}":`, error);
      throw error;
    }
  }

  async getKeyType(key: string) {
    try {
      const type = await this.client.type(key);
      console.log(`Key "${key}" is of type:`, type);
      return type;
    } catch (error) {
      console.error(`Error getting type for key "${key}":`, error);
      throw error;
    }
  }

  async getKeyValue(key: string) {
    try {
      const type = await this.client.type(key);

      let value;
      switch (type) {
        case 'string':
          value = await this.client.get(key);
          break;
        case 'hash':
          value = await this.client.hGetAll(key);
          break;
        case 'list':
          value = await this.client.lRange(key, 0, -1);
          break;
        case 'set':
          value = await this.client.sMembers(key);
          break;
        case 'zset':
          value = await this.client.zRange(key, 0, -1, { WITH_SCORES: true });
          break;
        case 'ReJSON-RL':
        case 'json':
          // Redis JSON module
          value = await this.client.json.get(key);
          break;
        default:
          console.warn(`Unknown type "${type}" for key "${key}"`);
          return null;
      }

      return value;
    } catch (error) {
      console.error(`Error getting value for key "${key}":`, error);
      throw error;
    }
  }

  async getHashValue(key: string, field?: string) {
    try {
      if (field) {
        const value = await this.client.hGet(key, field);
        console.log(`Hash value for "${key}.${field}":`, value);
        return value;
      } else {
        const value = await this.client.hGetAll(key);
        console.log(`Hash value for "${key}":`, value);
        return value;
      }
    } catch (error) {
      console.error(`Error getting hash value for key "${key}":`, error);
      throw error;
    }
  }

  async getJsonValue(key: string, path: string = '$') {
    try {
      const value = await this.client.json.get(key, { path });
      console.log(`JSON value for "${key}" at path "${path}":`, value);
      return value;
    } catch (error) {
      console.error(`Error getting JSON value for key "${key}":`, error);
      throw error;
    }
  }

  // Get client for advanced operations
  getClient() {
    return this.client;
  }
}

const run = async () => {
  const redis = new RedisConnection();
  const database = new DatabaseService();
  await redis.connect();

  try {
    // Get all keys and count them
    const allKeys = await redis.getAllKeys('*');
    console.log(`\n=== Redis Key Count ===`);
    console.log(`Total keys in Redis: ${allKeys.length}`);

    // Optional: Show first 10 keys as examples
    for (const key of allKeys) {
      console.log(key);
      const value = await redis.getKeyValue(key);
      const itemsToKeep = [];

      for (const item of value.items) {
        if (item.reference_id && item.reference_id.startsWith('20251111')) {
          const newReferenceId = item.reference_id.replace(
            /^20251111/,
            '20251112'
          );
          item.reference_id = newReferenceId;
          const procurementGood =
            await database.imProcurementProd.supplier_items.findFirst({
              where: {
                supplier_reference_id: newReferenceId,
              },
            });
          if (!procurementGood) {
            console.log('Good not found - removing item:', newReferenceId);
            continue; // Skip adding to itemsToKeep
          }
          if (Number(procurementGood?.price) === Number(item.price)) {
            // console.log('Price is the same');
          } else {
            // console.log(
            //   'Price is different',
            //   procurementGood?.price,
            //   item.price
            // );
            // Update price in Redis
            item.price = procurementGood?.price;
            console.log('Updated price in Redis:', item.price);
          }
        }
        itemsToKeep.push(item);
      }

      value.items = itemsToKeep;
      await redis.getClient().json.set(key, '$', value);
    }
  } catch (error) {
    console.error('Error in Redis operations:', error);
  } finally {
    await redis.disconnect();
  }
};

run();
