import AWS from 'aws-sdk';
import cron from 'node-cron';

import dotenv from 'dotenv';
import { compressData, decompressData } from './compression';

dotenv.config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

let CACHE_TABLE = 'CacheTable';
let CACHE_EXPIRY_SECONDS = 1800; // Default cache expiry time in seconds (30 Minutes)

const getCachedData = async (key) => {
  const params = {
    TableName: CACHE_TABLE,
    Key: { cacheKey: key },
  };
  try {
    const result = await dynamoDb.get(params).promise();
    if (result.Item && result.Item.data) {
      const now = Math.floor(Date.now() / 1000);
      if (result.Item.ttl < now) {
        console.log(`Cache for key ${key} has expired.`);
        return null;
      }
      console.log(`Cache hit for key ${key}`);
      const decompressedData = await decompressData(Buffer.from(result.Item.data, 'base64'));
      return decompressedData;
    }
    console.log(`Cache miss for key ${key}`);
    return null;
  } catch (error) {
    console.error(`Error getting cached data for key ${key}:`, error);
    throw error;
  }
};

const setCachedData = async (key, data, expirySeconds = CACHE_EXPIRY_SECONDS) => {
  if (data === undefined || data === null) {
    throw new Error(`Cannot cache undefined or null data for key ${key}`);
  }
  try {
    const compressedData = await compressData(data);
    const params = {
      TableName: CACHE_TABLE,
      Item: {
        cacheKey: key,
        data: compressedData.toString(), 
        ttl: Math.floor(Date.now() / 1000) + expirySeconds,
      },
    };
    await dynamoDb.put(params).promise();
    console.log(`Cache set for key ${key} and will expire in ${expirySeconds} seconds.`);
  } catch (error) {
    console.error(`Error setting cached data for key ${key}:`, error);
    throw error;
  }
};

const refreshCache = async (key, refreshFunction) => {
  try {
    console.log(`Refreshing cache for key ${key}...`);
    const newData = await refreshFunction();
    
    // Check if newData is undefined or null
    if (newData === undefined || newData === null) {
      console.error(`Refresh function returned undefined or null for key ${key}`);
      // Handle this case: skip cache update or set a default value
      // For example, you can skip updating the cache:
      return;
      // Or you can set a default value:
      // newData = {}; // Or some other default value
    }
    
    await setCachedData(key, newData);
    console.log(`Cache refreshed for key ${key}`);
  } catch (error) {
    console.error(`Error refreshing cache for key ${key}:`, error);
    throw error;
  }
};

const generateCacheKey = (prefix, params) => {
  const paramKeys = Object.keys(params).sort();
  const keyParts = [prefix, ...paramKeys.map(key => `${key}_${params[key]}`)];
  return keyParts.join('_');
};

const configureCache = (table, expirySeconds) => {
  CACHE_TABLE = table;
  CACHE_EXPIRY_SECONDS = expirySeconds;
};

const scheduleCacheRefresh = (key, refreshFunction, interval = '*/5 * * * *') => {
  cron.schedule(interval, async () => {
    console.log(`Scheduled refresh for cache key ${key}`);
    try {
      await refreshCache(key, refreshFunction);
    } catch (error) {
      console.error(`Scheduled refresh error for cache key ${key}:`, error);
    }
  });
};

export {
  getCachedData,
  setCachedData,
  refreshCache,
  generateCacheKey,
  configureCache,
  scheduleCacheRefresh,
};
