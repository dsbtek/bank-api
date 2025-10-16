import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../utils/redis';

const store = new RedisStore({
  sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  prefix: 'rate_limit:',
});

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store,
});

export const transferRateLimit = rateLimit({
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
