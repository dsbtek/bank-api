import { ErrorRequestHandler } from 'express';
import logger from '@utils/logger'; // adjust path if your logger is in utils

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode?: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, errorCode?: string, isOperational = true) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error('Error occurred:', err);

  if (err instanceof AppError) {
     res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.errorCode,
      timestamp: new Date().toISOString(),
    });
    return
  }

  if ((err as any).code === 11000) {
     res.status(409).json({
      success: false,
      error: 'Resource already exists',
      timestamp: new Date().toISOString(),
    });
    return
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
  });
  return
};
