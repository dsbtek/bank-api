import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../utils/AppError';

export const validate = (schema: {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    // Validate request params
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    // Validate query params
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    if (errors.length > 0) {
      throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
    }

    next();
  };
};

// Validation schemas
export const authSchemas = {
  signup: Joi.object({
    email: Joi.string().email().required().trim().lowercase(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().max(50).required().trim(),
    lastName: Joi.string().max(50).required().trim(),
    phone: Joi.string().pattern(/^\+?[\d\s-()]{10,}$/).required(),
    role: Joi.string().valid('customer', 'admin').default('customer')
  }),

  login: Joi.object({
    email: Joi.string().email().required().trim().lowercase(),
    password: Joi.string().required()
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  })
};

export const transferSchemas = {
  initiateTransfer: Joi.object({
    fromAccountId: Joi.string().hex().length(24).required(),
    toAccountNumber: Joi.string().pattern(/^\d{10}$/).required(),
    amount: Joi.number().positive().precision(2).max(1000000).required(), // Max $1,000,000
    reference: Joi.string().max(100).required(),
    description: Joi.string().max(500).optional()
  }),

  transactionHistory: Joi.object({
    accountId: Joi.string().hex().length(24).required(),
    page: Joi.number().integer().positive().default(1),
    limit: Joi.number().integer().positive().max(100).default(10)
  }),
  getBalance: Joi.object({
    accountId: Joi.string().hex().length(24).required()
  })
};

export const accountSchemas = {
  createAccount: Joi.object({
    type: Joi.string().valid('savings', 'current', 'salary').default('savings'),
    currency: Joi.string().length(3).uppercase().default('USD'),
    initialBalance: Joi.number().precision(2).min(0).default(0),
    accountNumber: Joi.string().pattern(/^\d{10}$/).optional()
  }),

  getBalance: Joi.object({
    accountId: Joi.string().hex().length(24).required()
  }),

  updateAccount: Joi.object({
    type: Joi.string().valid('savings', 'current', 'salary'),
    dailyTransferLimit: Joi.number().precision(2).min(0),
    isActive: Joi.boolean()
  }),

  checkTransfer: Joi.object({
    amount: Joi.number().precision(2).positive().required()
  })
};