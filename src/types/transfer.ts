import { ITransaction } from ".";

export interface TransferRequest {
  fromAccountId: string;
  toAccountNumber: string;
  amount: number;
  reference: string;
  description?: string;
}

export interface TransactionResponse {
  id: string;
  amount: number;
  currency: string;
  reference: string;
  status: string;
  fromAccount: string;
  toAccount: string;
  createdAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
// transactions?: ITransaction;
  data?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface BalanceResponse {
  accountId: string;
  balance: number;
  currency: string;
}