import type { TransactionType } from '../domain/transaction';

export interface CreateTransactionCommand {
  accountId: string;
  relatedAccountId?: string;
  projectId?: string;
  categoryId?: string;
  type: TransactionType;
  amountMinor: number;
  currency?: string;
  description?: string;
  occurredAt?: string;
}
