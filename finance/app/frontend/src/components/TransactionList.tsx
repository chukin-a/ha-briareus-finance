import type { Account, Category, Transaction } from '../types/finance';
import { TransactionItem } from './TransactionItem';

export function TransactionList({ transactions, accounts, categories, onTransactionClick, limit = 12 }: { transactions: Transaction[]; accounts: Account[]; categories: Category[]; onTransactionClick?: (transaction: Transaction) => void; limit?: number }) {
  if (!transactions.length) return <p className="empty">Операцій за період немає</p>;
  return <div className="transactions">{transactions.slice(0, limit).map(transaction => <TransactionItem key={transaction.id} transaction={transaction} accounts={accounts} categories={categories} onClick={onTransactionClick ? () => onTransactionClick(transaction) : undefined} />)}</div>;
}
