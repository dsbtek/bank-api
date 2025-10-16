import mongoose from 'mongoose';
import { TransferRequest, TransactionStatus } from '../types';
import Account from '../models/Account';
import Transaction from '../models/Transaction';
import { AppError } from '../utils/AppError';

export class TransferService {
  static async initiateTransfer(transferData: TransferRequest, userId: string): Promise<any> {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();

      // Find source account with session for transaction
      const fromAccount = await Account.findOne({
        _id: transferData.fromAccountId,
        userId,
        isActive: true
      }).session(session);

      if (!fromAccount) {
        throw new AppError('Source account not found or inactive', 404);
      }

      // Find destination account
      const toAccount = await Account.findOne({
        accountNumber: transferData.toAccountNumber,
        isActive: true
      }).session(session);

      if (!toAccount) {
        throw new AppError('Destination account not found or inactive', 404);
      }

      // Check if transferring to same account
      if (fromAccount._id.toString() === toAccount._id.toString()) {
        throw new AppError('Cannot transfer to the same account', 400);
      }

      // Validate transfer amount
      if (transferData.amount <= 0) {
        throw new AppError('Transfer amount must be positive', 400);
      }

      // Check daily transfer limits
      fromAccount.resetDailyTransferLimit();
      if (!fromAccount.canTransfer(transferData.amount)) {
        throw new AppError('Transfer limit exceeded or insufficient funds', 400);
      }

      // Check sufficient funds
      if (fromAccount.balance < transferData.amount) {
        throw new AppError('Insufficient funds', 400);
      }

      // Perform transfer
      fromAccount.balance -= transferData.amount;
      toAccount.balance += transferData.amount;
      fromAccount.usedDailyTransferAmount += transferData.amount;

      // Create transaction record
      const transaction = new Transaction({
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
          destinationAccount: toAccount.accountNumber
        }
      });

      // Save all changes
      await Promise.all([
        fromAccount.save({ session }),
        toAccount.save({ session }),
        transaction.save({ session })
      ]);

      await session.commitTransaction();

      // Populate transaction details for response
      await transaction.populate([
        { path: 'fromAccount', select: 'accountNumber userId' },
        { path: 'toAccount', select: 'accountNumber userId' }
      ]);

      return transaction;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getTransactionHistory(accountId: string, userId: string, page: number = 1, limit: number = 10): Promise<any> {
    // Verify account belongs to user
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      throw new AppError('Account not found', 404);
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find({
        $or: [
          { fromAccount: accountId },
          { toAccount: accountId }
        ]
      })
      .populate('fromAccount', 'accountNumber')
      .populate('toAccount', 'accountNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
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
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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
}