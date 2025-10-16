import { Response } from 'express';
import { TransferService } from '../services/TransferService';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../types';

export class TransferController {
  static async initiateTransfer(req: AuthRequest, res: Response): Promise<void> {
    const transaction = await TransferService.initiateTransfer(req.body, req.user!.id);

    res.status(201).json({
      success: true,
      message: 'Transfer completed successfully',
      data: {
        transaction: {
          id: transaction._id,
          amount: transaction.amount,
          currency: transaction.currency,
          reference: transaction.reference,
          status: transaction.status,
          fromAccount: transaction.fromAccount,
          toAccount: transaction.toAccount,
          createdAt: transaction.createdAt
        }
      }
    });
  }

  static async getTransactionHistory(req: AuthRequest, res: Response): Promise<void> {
    const { accountId } = req.params;
    const { page, limit } = req.query;
    if (!accountId) throw new Error('accountId is required');
    const result = await TransferService.getTransactionHistory(
      accountId,
      req.user!.id,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 10
    );

    res.json({
      success: true,
      data: result
    });
  }

  static async getAccountBalance(req: AuthRequest, res: Response): Promise<void> {
    const { accountId } = req.params;
    if (!accountId) throw new Error('accountId is required');
    const balance = await TransferService.getAccountBalance(accountId, req.user!.id);

    res.json({
      success: true,
      data: {
        accountId,
        balance,
        currency: 'USD' // Assuming USD for simplicity
      }
    });
  }
}