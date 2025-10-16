import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/default';
import redisClient from '../utils/redis';
import { AppError } from '../utils/AppError';
import { AuthRequest, UserRole } from '../types';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Access token required', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    // Check if token session is still valid (optional - for immediate revocation)
    const tokenExists = await redisClient.exists(`blacklist_token:${token}`);
    if (tokenExists) {
      throw new AppError('Token has been revoked', 401);
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      sessionId: decoded.sessionId
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

// Role-based authorization shortcuts
export const requireCustomer = authorize(UserRole.CUSTOMER);
export const requireAdmin = authorize(UserRole.ADMIN);