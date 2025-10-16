import { createClient } from 'redis';
import config from '../config/default';
import logger from './logger';

class RedisClient {
  private client: any;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
    });

    this.setupEventListeners();
    this.connect();
  }

  private setupEventListeners(): void {
    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis client connected');
    });

    this.client.on('error', (error: Error) => {
      this.isConnected = false;
      logger.error('Redis client error:', error);
    });

    this.client.on('disconnect', () => {
      this.isConnected = false;
      logger.warn('Redis client disconnected');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis GET error:', error);
      throw error;
    }
  }

  async set(key: string, value: string, mode: string = 'EX', duration: number = 3600): Promise<void> {
    try {
      await this.client.set(key, value, {
        [mode]: duration,
      });
    } catch (error) {
      logger.error('Redis SET error:', error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis DEL error:', error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      throw error;
    }
  }

  async sendCommand(args: string[]): Promise<any> {
    try {
      return await this.client.sendCommand(args);
    } catch (error) {
      logger.error('Redis command error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;