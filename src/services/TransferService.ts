import mongoose from 'mongoose';
import { TransferRequest, PaginationParams, PaginatedResponse } from '../types/transfer';
import { TransactionStatus } from '../types';
import Account from '../models/Account';
import Transaction from '../models/Transaction';
import { AppError } from '../utils/AppError';

export class TransferService {
  static async initiateTransfer(transferData: TransferRequest, userId: string): Promise<any> {
    const { fromAccountId, toAccountNumber, amount } = transferData;

    try {
      // Validate accounts without session
      const [fromAccount, toAccount] = await this.validateAccounts(
        fromAccountId, 
        toAccountNumber, 
        userId
      );

      // Validate transfer amount and limits
      await this.validateTransferAmount(fromAccount, amount);

      // Perform transfer without transaction
      const result = await this.executeTransferWithoutTransaction(
        fromAccount, 
        toAccount, 
        amount, 
        transferData, 
        userId
      );

      return result;

    } catch (error) {
      console.error('TransferService.initiateTransfer error:', error);
      throw error;
    }
  }

  static async getTransactionHistory(
    accountId: string, 
    userId: string, 
    pagination: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    
    await this.verifyAccountOwnership(accountId, userId);

    const skip = (pagination.page - 1) * pagination.limit;

    const [transactions, total] = await Promise.all([
      Transaction.find({
        $or: [
          { fromAccount: accountId },
          { toAccount: accountId }
        ]
      })
      .populate('fromAccount', 'accountNumber userId type currency')
      .populate('toAccount', 'accountNumber userId type currency')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pagination.limit)
      .lean(),

      Transaction.countDocuments({
        $or: [
          { fromAccount: accountId },
          { toAccount: accountId }
        ]
      })
    ]);

    return {
      transactions,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit)
      }
    };
  }

  static async getAccountBalance(accountId: string, userId: string): Promise<number> {
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      throw new AppError('Account not found', 404);
    }
    return account.balance;
  }

  private static async validateAccounts(
    fromAccountId: string, 
    toAccountNumber: string, 
    userId: string
  ): Promise<[any, any]> {
    
    const [fromAccount, toAccount] = await Promise.all([
      Account.findOne({
        _id: fromAccountId,
        userId,
        isActive: true
      }),
      
      Account.findOne({
        accountNumber: toAccountNumber,
        isActive: true
      })
    ]);

    if (!fromAccount) {
      throw new AppError('Source account not found or inactive', 404);
    }

    if (!toAccount) {
      throw new AppError('Destination account not found or inactive', 404);
    }

    if (fromAccount._id.toString() === toAccount._id.toString()) {
      throw new AppError('Cannot transfer to the same account', 400);
    }

    // Check currency compatibility
    if (fromAccount.currency !== toAccount.currency) {
      throw new AppError('Currency conversion not supported', 400);
    }

    return [fromAccount, toAccount];
  }

  private static async validateTransferAmount(account: any, amount: number): Promise<void> {
    if (amount <= 0) {
      throw new AppError('Transfer amount must be positive', 400);
    }

    if (!account.isActive) {
      throw new AppError('Account is not active', 400);
    }

    // Manual reset and validation
    const now = new Date();
    const lastReset = new Date(account.lastTransferReset);
    
    // Reset daily limit if it's a new day
    if (now.toDateString() !== lastReset.toDateString()) {
      account.usedDailyTransferAmount = 0;
      account.lastTransferReset = now;
      await account.save(); // Save the reset
    }

    // Check sufficient funds
    if (account.balance < amount) {
      throw new AppError('Insufficient funds', 400);
    }

    // Check daily limit
    if ((account.usedDailyTransferAmount + amount) > account.dailyTransferLimit) {
      const remaining = account.dailyTransferLimit - account.usedDailyTransferAmount;
      throw new AppError(
        `Daily transfer limit exceeded. Remaining limit: ${remaining}`,
        400
      );
    }
  }

  private static async executeTransferWithoutTransaction(
    fromAccount: any, 
    toAccount: any, 
    amount: number,
    transferData: TransferRequest,
    userId: string
  ): Promise<any> {
    
    // Update balances atomically using MongoDB atomic operations
    const updatedFromAccount = await Account.findOneAndUpdate(
      { 
        _id: fromAccount._id, 
        balance: { $gte: amount }, // Ensure balance hasn't changed
        version: fromAccount.version // Optimistic concurrency control
      },
      { 
        $inc: { 
          balance: -amount,
          usedDailyTransferAmount: amount,
          version: 1
        },
        $set: {
          lastTransferReset: fromAccount.lastTransferReset // Keep the same reset date
        },
        // $inc: { version: 1 } // Increment version for optimistic locking
      },
      { new: true, runValidators: true }
    );
    console.log(updatedFromAccount)
    // if (!updatedFromAccount) {
    //   throw new AppError('Transfer failed: Account balance changed or insufficient funds', 400);
    // }

    const updatedToAccount = await Account.findOneAndUpdate(
      { _id: toAccount._id },
      { 
        $inc: { balance: amount }
      },
      { new: true, runValidators: true }
    );

    if (!updatedToAccount) {
      // This should rarely happen, but if it does, we need to revert the from account
      await Account.findOneAndUpdate(
        { _id: fromAccount._id },
        { 
          $inc: { 
            balance: amount,
            usedDailyTransferAmount: -amount
          }
        }
      );
      throw new AppError('Transfer failed: Could not update destination account', 500);
    }

    // Create transaction record
    const transaction = await Transaction.create({
      fromAccount: fromAccount._id,
      toAccount: toAccount._id,
      amount: transferData.amount,
      currency: fromAccount.currency,
      reference: transferData.reference,
      description: transferData.description,
      status: TransactionStatus.COMPLETED,
      metadata: {
        initiatedBy: userId,
        sourceAccount: fromAccount.accountNumber,
        destinationAccount: toAccount.accountNumber,
        sourceUserId: fromAccount.userId,
        destinationUserId: toAccount.userId
      }
    });

    // Populate and return the transaction
    return await Transaction.findById(transaction._id)
      .populate('fromAccount', 'accountNumber userId type currency')
      .populate('toAccount', 'accountNumber userId type currency');
  }

  private static async verifyAccountOwnership(accountId: string, userId: string): Promise<void> {
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      throw new AppError('Account not found', 404);
    }
  }

  // Alternative: Simple version without optimistic locking (less safe but simpler)
  private static async executeTransferSimple(
    fromAccount: any, 
    toAccount: any, 
    amount: number,
    transferData: TransferRequest,
    userId: string
  ): Promise<any> {
    
    // Update accounts
    fromAccount.balance -= amount;
    fromAccount.usedDailyTransferAmount += amount;
    
    toAccount.balance += amount;

    // Save both accounts
    await Promise.all([
      fromAccount.save(),
      toAccount.save()
    ]);

    // Create transaction record
    const transaction = await Transaction.create({
      fromAccount: fromAccount._id,
      toAccount: toAccount._id,
      amount: transferData.amount,
      currency: fromAccount.currency,
      reference: transferData.reference,
      description: transferData.description,
      status: TransactionStatus.COMPLETED,
      metadata: {
        initiatedBy: userId,
        sourceAccount: fromAccount.accountNumber,
        destinationAccount: toAccount.accountNumber,
        sourceUserId: fromAccount.userId,
        destinationUserId: toAccount.userId
      }
    });

    return await Transaction.findById(transaction._id)
      .populate('fromAccount', 'accountNumber userId type currency')
      .populate('toAccount', 'accountNumber userId type currency');
  }
}