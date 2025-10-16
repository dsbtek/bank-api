import { Request } from 'express';
import { Document, ObjectId } from 'mongoose';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum AccountType {
  SAVINGS = 'savings',
  CURRENT = 'current',
  SALARY = 'salary'
}

export interface IUser extends Document {
  _id: ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IAccount extends Document {
  _id: ObjectId;
  accountNumber: string;
  userId: ObjectId;
  type: AccountType;
  balance: number;
  currency: string;
  isActive: boolean;
  dailyTransferLimit: number;
  usedDailyTransferAmount: number;
  lastTransferReset: Date;
  createdAt: Date;
  updatedAt: Date;
  
  canTransfer(amount: number): boolean;
  resetDailyTransferLimit(): void;
}

export interface ITransaction extends Document {
  _id: ObjectId;
  fromAccount: ObjectId;
  toAccount: ObjectId;
  amount: number;
  currency: string;
  reference: string;
  status: TransactionStatus;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRefreshToken extends Document {
  token: string;
  userId: ObjectId;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    sessionId: string;
  };
}

export interface FizzBuzzConfig {
  range: [number, number];
  rules: Map<number, string>;
}

export interface TransferRequest {
  fromAccountId: string;
  toAccountNumber: string;
  amount: number;
  reference: string;
  description?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: UserRole;
}

export interface RateLimitRequest {
  ip: string;
  path: string;
  limit: number;
}

export interface AuthenticatedRequest<
  P = Record<string, any>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Record<string, any>
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: { id: string };
}