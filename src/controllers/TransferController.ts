import { Response } from 'express';
import { TransferService } from '../services/TransferService';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../types';
import { 
  TransferRequest, 
  TransactionResponse, 
  BalanceResponse,
  PaginationParams 
} from '../types/transfer';

export class TransferController {
  static async initiateTransfer(req: AuthRequest, res: Response): Promise<void> {
    const transferData: TransferRequest = req.body;
    const userId = req.user!.id;

    // FIX: Call the static method directly on the class
    TransferController.validateTransferRequest(transferData);

    const transaction = await TransferService.initiateTransfer(transferData, userId);

    const response: TransactionResponse = {
      id: transaction._id.toString(),
      amount: transaction.amount,
      currency: transaction.currency,
      reference: transaction.reference,
      status: transaction.status,
      fromAccount: transaction.fromAccount.toString(),
      toAccount: transaction.toAccount.toString(),
      createdAt: transaction.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Transfer completed successfully',
      data: { transaction: response }
    });
  }

  static async getTransactionHistory(req: AuthRequest, res: Response): Promise<void> {
    const { accountId } = req.params;
    const { page = '1', limit = '10' } = req.query;

    if (!accountId) {
      throw new AppError('Account ID is required', 400);
    }

    const pagination: PaginationParams = {
      page: Math.max(1, parseInt(page as string)),
      limit: Math.min(100, Math.max(1, parseInt(limit as string)))
    };

    const result = await TransferService.getTransactionHistory(
      accountId,
      req.user!.id,
      pagination
    );

    res.json({
      success: true,
      data: result
    });
  }

  static async getAccountBalance(req: AuthRequest, res: Response): Promise<void> {
    const { accountId } = req.params;

    if (!accountId) {
      throw new AppError('Account ID is required', 400);
    }

    const balance = await TransferService.getAccountBalance(accountId, req.user!.id);

    const response: BalanceResponse = {
      accountId,
      balance,
      currency: 'USD'
    };

    res.json({
      success: true,
      data: response
    });
  }

  private static validateTransferRequest(data: TransferRequest): void {
    const { fromAccountId, toAccountNumber, amount, reference } = data;

    if (!fromAccountId || !toAccountNumber || !reference) {
      throw new AppError('Missing required fields', 400);
    }

    if (typeof amount !== 'number' || amount <= 0) {
      throw new AppError('Amount must be a positive number', 400);
    }

    if (fromAccountId === toAccountNumber) {
      throw new AppError('Cannot transfer to the same account', 400);
    }

    // Additional validation
    if (fromAccountId.length !== 24) {
      throw new AppError('Invalid source account ID format', 400);
    }

    if (toAccountNumber.length !== 10) {
      throw new AppError('Destination account number must be 10 digits', 400);
    }

    if (reference.length > 100) {
      throw new AppError('Reference too long (max 100 characters)', 400);
    }
  }
}