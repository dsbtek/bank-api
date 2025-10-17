import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../utils/redis';

// Create store only if not in test environment
const store = process.env.NODE_ENV === 'test' 
  ? undefined // Use in-memory store for tests
  : new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      prefix: 'rate_limit:',
    });

// No-op middleware for tests, actual rate limiting for other environments
export const generalRateLimit = process.env.NODE_ENV === 'test'
  ? (req: any, res: any, next: any) => next() // Bypass rate limiting in tests
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      store,
    });

export const authRateLimit = process.env.NODE_ENV === 'test'
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: 'Too many login attempts, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      store,
    });

export const transferRateLimit = process.env.NODE_ENV === 'test'
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
      windowMs: 24 * 60 * 60 * 1000,
      max: 10,
      keyGenerator: (req) => {
        const r = req as unknown as { ip: string; user?: { id: string } };
        return r.user?.id || r.ip;
      },
      message: 'Daily transfer limit exceeded. Try again tomorrow.',
      standardHeaders: true,
      legacyHeaders: false,
      store,
    });