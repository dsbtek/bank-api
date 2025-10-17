import mongoose, { Types } from 'mongoose';
import Account from '../models/Account';
import { AppError } from '../utils/AppError';
import { AccountType, IAccount } from '../types';

export class AccountService {
  /**
   * Create a new account for a user
   */
  static async createAccount(userId: string, accountData: {
    type?: AccountType;
    currency?: string; 
    initialBalance?: number;
    accountNumber?: string;
  }): Promise<IAccount> {
    try {
      const { type = 'savings', currency = 'USD', initialBalance = 0, accountNumber } = accountData;

      // Validate initial balance
      if (initialBalance < 0) {
        throw new AppError('Initial balance cannot be negative', 400);
      }

      // Check if user already has too many accounts (optional limit)
      const existingAccountsCount = await Account.countDocuments({ userId, isActive: true });
      if (existingAccountsCount >= 5) {
        throw new AppError('Maximum account limit reached', 400);
      }

      // Create account - let the pre-save hook generate accountNumber
      const account = await Account.create({
        userId: new mongoose.Types.ObjectId(userId),
        type: type,
        currency: currency,
        balance: initialBalance,
        accountNumber: accountNumber
      });

      return account;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      // Handle Mongoose validation errors
      if (error instanceof mongoose.Error.ValidationError) {
        const firstError = Object.values(error.errors)[0];
        throw new AppError(firstError!.message, 400);
      }
      
      // Handle duplicate key errors
      if ((error as any).code === 11000) {
        throw new AppError('Account with this number already exists', 409);
      }
      
      console.error('Account creation error:', error);
      throw new AppError('Failed to create account', 500);
    }
  }

  /**
   * Get all accounts for a user
   */
  static async getUserAccounts(userId: string, includeInactive: boolean = false): Promise<IAccount[]> {
    try {
      const query: any = { userId: new Types.ObjectId(userId) };
      if (!includeInactive) {
        query.isActive = true;
      }

      const accounts = await Account.find(query)
        .select('-__v')
        .sort({ createdAt: -1 });

      return accounts;
    } catch (error) {
      throw new AppError('Failed to fetch user accounts', 500);
    }
  }

  /**
   * Get specific account by ID with ownership verification
   */
  static async getAccountById(accountId: string | undefined, userId: string): Promise<IAccount> {
    try {
      if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
        throw new AppError('Invalid account ID', 400);
      }

      const account = await Account.findOne({
        _id: new Types.ObjectId(accountId),
        userId: new Types.ObjectId(userId)
      });

      if (!account) {
        throw new AppError('Account not found', 404);
      }

      return account;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch account', 500);
    }
  }

  /**
   * Get account by account number (for transfers)
   */
  static async getAccountByNumber(accountNumber: string): Promise<IAccount> {
    try {
      const account = await Account.findOne({
        accountNumber,
        isActive: true
      });

      if (!account) {
        throw new AppError('Account not found', 404);
      }

      return account;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch account', 500);
    }
  }

  /**
   * Update account details
   */
  static async updateAccount(
    accountId: string | undefined, 
    userId: string, 
    updates: Partial<{
      type: AccountType;
      dailyTransferLimit: number;
      isActive: boolean;
    }>
  ): Promise<IAccount> {
    try {
      // Verify account ownership
      const account = await this.getAccountById(accountId, userId);

      // Validate daily transfer limit
      if (updates.dailyTransferLimit !== undefined && updates.dailyTransferLimit < 0) {
        throw new AppError('Daily transfer limit cannot be negative', 400);
      }

      // Update allowed fields
      const allowedUpdates: any = {};
      if (updates.type !== undefined) allowedUpdates.type = updates.type;
      if (updates.dailyTransferLimit !== undefined) allowedUpdates.dailyTransferLimit = updates.dailyTransferLimit;
      if (updates.isActive !== undefined) allowedUpdates.isActive = updates.isActive;

      const updatedAccount = await Account.findOneAndUpdate(
        { _id: new Types.ObjectId(accountId), userId: new Types.ObjectId(userId) },
        { $set: allowedUpdates },
        { new: true, runValidators: true }
      );

      if (!updatedAccount) {
        throw new AppError('Account not found', 404);
      }

      return updatedAccount;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update account', 500);
    }
  }

  /**
   * Deactivate account (soft delete)
   */
  static async deactivateAccount(accountId: string | undefined, userId: string): Promise<IAccount> {
    try {
      // Verify account exists and belongs to user
      const account = await this.getAccountById(accountId, userId);

      // Check if account has zero balance
      if (account.balance > 0) {
        throw new AppError('Cannot deactivate account with positive balance', 400);
      }

      const updatedAccount = await Account.findOneAndUpdate(
        { _id: new Types.ObjectId(accountId), userId: new Types.ObjectId(userId) },
        { $set: { isActive: false } },
        { new: true }
      );

      if (!updatedAccount) {
        throw new AppError('Account not found', 404);
      }

      return updatedAccount;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to deactivate account', 500);
    }
  }

  /**
   * Reset daily transfer limit if it's a new day
   */
  private static async resetDailyTransferIfNeeded(account: IAccount): Promise<IAccount> {
    try {
      const now = new Date();
      const lastReset = new Date(account.lastTransferReset);
      
      // Check if it's a new day (compare dates without time)
      if (lastReset.toDateString() !== now.toDateString()) {
        const updatedAccount = await Account.findByIdAndUpdate(
          account._id,
          {
            $set: {
              usedDailyTransferAmount: 0,
              lastTransferReset: now
            }
          },
          { new: true }
        );
        
        if (updatedAccount) {
          return updatedAccount;
        }
      }
      
      return account;
    } catch (error) {
      console.error('Error resetting daily transfer:', error);
      return account; // Return original account if reset fails
    }
  }

  /**
   * Get account summary with additional details
   */
  static async getAccountSummary(accountId: string | undefined, userId: string): Promise<any> {
    try {
      let account = await this.getAccountById(accountId, userId);

      // Reset daily transfer if needed and get updated account
      account = await this.resetDailyTransferIfNeeded(account);

      const availableToday = Math.min(
        account.balance,
        account.dailyTransferLimit - account.usedDailyTransferAmount
      );

      return {
        account: {
          id: account._id,
          accountNumber: account.accountNumber,
          type: account.type,
          balance: account.balance,
          currency: account.currency,
          isActive: account.isActive,
          dailyTransferLimit: account.dailyTransferLimit,
          usedDailyTransferAmount: account.usedDailyTransferAmount,
          availableToday: availableToday,
          lastTransferReset: account.lastTransferReset,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt
        }
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get account summary', 500);
    }
  }


  /**
   * Verify if account can perform transfer
   */
  static async canTransfer(accountId: string | undefined, amount: number): Promise<{ canTransfer: boolean; reason?: string, test?: any }> {
    try {
      if (!accountId) {
        return { canTransfer: false, reason: 'Invalid account ID' };
      }

      let account = await Account.findById(accountId);
      
      if (!account || !account.isActive) {
        return { canTransfer: false, reason: 'Account not found or inactive' };
      }

      // Reset daily transfer if needed
      account = await this.resetDailyTransferIfNeeded(account);

      if (account.balance < amount) {
        return { canTransfer: false, reason: 'Insufficient funds' };
      }

      if ((account.usedDailyTransferAmount + amount) > account.dailyTransferLimit) {
        return { canTransfer: false, reason: 'Daily transfer limit exceeded', test: {...account, amount_: amount} };
      }

      return { canTransfer: true };
    } catch (error) {
      console.error('Error checking transfer eligibility:', error);
      return { canTransfer: false, reason: 'Error checking transfer eligibility' };
    }
  }
}