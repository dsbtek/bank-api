import { Request, Response, NextFunction } from 'express';
import { AccountService } from '../services/AccountService';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../types';

export class AccountController {
  /**
   * Create a new account
   */
  static async createAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('User authentication required', 401);

      const account = await AccountService.createAccount(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          account: {
            id: account._id,
            accountNumber: account.accountNumber,
            type: account.type,
            balance: account.balance,
            currency: account.currency,
            dailyTransferLimit: account.dailyTransferLimit,
            isActive: account.isActive,
            createdAt: account.createdAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all user accounts
   */
  static async getUserAccounts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('User authentication required', 401);

      const includeInactive = req.query.includeInactive === 'true';
      const accounts = await AccountService.getUserAccounts(userId, includeInactive);

      res.json({
        success: true,
        data: {
          accounts: accounts.map(account => ({
            id: account._id,
            accountNumber: account.accountNumber,
            type: account.type,
            balance: account.balance,
            currency: account.currency,
            isActive: account.isActive,
            dailyTransferLimit: account.dailyTransferLimit,
            usedDailyTransferAmount: account.usedDailyTransferAmount,
            lastTransferReset: account.lastTransferReset,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific account details
   */
  static async getAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('User authentication required', 401);

      const { accountId } = req.params;
      const account = await AccountService.getAccountById(accountId, userId);

      res.json({
        success: true,
        data: {
          account: {
            id: account._id,
            accountNumber: account.accountNumber,
            type: account.type,
            balance: account.balance,
            currency: account.currency,
            isActive: account.isActive,
            dailyTransferLimit: account.dailyTransferLimit,
            usedDailyTransferAmount: account.usedDailyTransferAmount,
            lastTransferReset: account.lastTransferReset,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get account summary with transfer availability
   */
  static async getAccountSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('User authentication required', 401);

      const { accountId } = req.params;
      const summary = await AccountService.getAccountSummary(accountId, userId);

       res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update account details
   */
  static async updateAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('User authentication required', 401);

      const { accountId } = req.params;
      const updatedAccount = await AccountService.updateAccount(accountId, userId, req.body);

       res.json({
        success: true,
        message: 'Account updated successfully',
        data: {
          account: {
            id: updatedAccount._id,
            accountNumber: updatedAccount.accountNumber,
            type: updatedAccount.type,
            balance: updatedAccount.balance,
            currency: updatedAccount.currency,
            isActive: updatedAccount.isActive,
            dailyTransferLimit: updatedAccount.dailyTransferLimit,
            usedDailyTransferAmount: updatedAccount.usedDailyTransferAmount,
            lastTransferReset: updatedAccount.lastTransferReset,
            updatedAt: updatedAccount.updatedAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate account
   */
  static async deactivateAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('User authentication required', 401);

      const { accountId } = req.params;
      const deactivatedAccount = await AccountService.deactivateAccount(accountId, userId);

       res.json({
        success: true,
        message: 'Account deactivated successfully',
        data: {
          account: {
            id: deactivatedAccount._id,
            accountNumber: deactivatedAccount.accountNumber,
            isActive: deactivatedAccount.isActive,
            deactivatedAt: deactivatedAccount.updatedAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check transfer eligibility
   */
  static async checkTransferEligibility(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('User authentication required', 401);

      const { accountId } = req.params;
      const { amount } = req.body;

      if (!amount || isNaN(amount) || amount <= 0) {
        throw new AppError('Valid amount is required', 400);
      }

      // Verify account ownership before checking eligibility
      await AccountService.getAccountById(accountId, userId);

      const eligibility = await AccountService.canTransfer(accountId, amount);

       res.json({
        success: true,
        data: {
          accountId,
          amount,
          eligible: eligibility.canTransfer,
          reason: eligibility.reason ?? null
        }
      });
      
    } catch (error) {
      next(error);
    }
  }
}
