import dotenv from 'dotenv';
import mongoose from 'mongoose';
import redisClient from '../src/utils/redis';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Disable rate limiting for tests
process.env.DISABLE_RATE_LIMIT = 'true';


// Global test timeout
jest.setTimeout(30000);

// Track if we've already set up Redis
let redisConnected = false;

// Global test setup - runs once before all tests
beforeAll(async () => {
  console.log('Global test setup started');
  
  // Connect to MongoDB only once
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/bank-api-test');
  }
  
  // Connect to Redis only once
  if (redisClient && !redisClient.getIsConnected() && !redisConnected) {
    try {
      await redisClient.connect();
      redisConnected = true;
    } catch (error) {
      console.log('Redis connection failed, continuing without Redis:', error);
    }
  }
  
  console.log('Global test setup complete');
});

// Global test teardown - runs once after all tests
afterAll(async () => {
  console.log('Global test cleanup started');
  
  // Close MongoDB connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  // Close Redis connection
  if (redisClient && redisClient.getIsConnected()) {
    await redisClient.disconnect();
  }
  
  console.log('Global test cleanup complete');
});

// Reset mocks and clear database between tests
afterEach(async () => {
  jest.clearAllMocks();
  
  // Clear all collections between tests with proper null checking
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      // Add null check to fix TypeScript error
      if (collection) {
        await collection.deleteMany({});
      }
    }
  }
});