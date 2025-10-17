// utils/errorHandler.ts
import { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import logger from '../utils/logger';
import { AppError } from '../utils/AppError';

/**
 * Global error handling middleware
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let error = err;

  // Enhanced logging for debugging
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    console.log('Raw Error Details:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode,
      url: req.url,
      method: req.method,
      body: { 
        ...req.body, 
        ...(req.body.password && { password: '[REDACTED]' }),
        ...(req.body.refreshToken && { refreshToken: '[REDACTED]' })
      }
    });
  }

  // Log the error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    // Don't log sensitive data
  });

  // Handle Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const firstError = Object.values(err.errors)[0];
    error = new AppError(firstError!.message, 400, 'VALIDATION_ERROR');
  }

  // Handle Mongoose duplicate key errors
  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`${field} already exists`, 409, 'DUPLICATE_ENTRY');
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  else if (err instanceof mongoose.Error.CastError) {
    error = new AppError('Invalid resource ID', 400, 'INVALID_ID');
  }

  // Handle JWT errors
  else if (err instanceof JsonWebTokenError) {
    error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
  else if (err instanceof TokenExpiredError) {
    error = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Handle other non-AppError instances
  else if (!(err instanceof AppError)) {
    // Log unexpected errors for debugging
    logger.error('Unexpected error type:', {
      errorConstructor: err.constructor.name,
      errorPrototype: Object.getPrototypeOf(err).constructor.name,
      fullError: err
    });
    
    error = new AppError(
      'Internal server error', 
      500, 
      'INTERNAL_ERROR', 
      false // non-operational error
    );
  }

  // Send error response
  const response: any = {
    success: false,
    error: error.message,
    timestamp: new Date().toISOString(),
  };

  // Include error code if present
  if (error.errorCode) {
    response.code = error.errorCode;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && !error.isOperational) {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};