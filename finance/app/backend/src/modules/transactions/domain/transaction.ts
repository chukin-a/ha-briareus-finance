export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  ownerId: string;
  accountId: string;
  relatedAccountId: string | null;
  projectId: string | null;
  categoryId: string | null;
  type: TransactionType;
  amountMinor: number;
  currency: string;
  description: string | null;
  occurredAt: string;
  createdAt: string;
}
