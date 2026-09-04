import { ArrowLeftRight } from 'lucide-react';
import type { Account, Category, Transaction } from '../types/finance';
import { money, shortDate } from '../lib/money';
import { CategoryIcon } from './CategoryIcon';
import { AuthorLabel } from './AuthorLabel';

export function TransactionItem({ transaction, accounts, categories, onClick }: { transaction: Transaction; accounts: Account[]; categories: Category[]; onClick?: () => void }) {
  return <article className={`transaction${onClick ? ' transaction-clickable' : ''}`} onClick={onClick}>
        <time>{shortDate(transaction.occurredOn || transaction.occurredAt)}</time>
    <div className={`transaction-icon ${transaction.type}`} title={transaction.type === 'transfer' ? 'Переказ' : categoryName(transaction, categories)} aria-label={transaction.type === 'transfer' ? 'Переказ' : categoryName(transaction, categories)}>
      <TransactionIcon transaction={transaction} categories={categories} />
    </div>
    <div className="transaction-copy">
      <strong>{transactionTitle(transaction, categories)}</strong>
      <span>{transactionAccountLine(transaction, accounts)}</span>
      <AuthorLabel ownerId={transaction.ownerId} ownerName={transaction.ownerName} />
    </div>
    <b className={transaction.type === 'income' ? 'income' : transaction.type === 'transfer' ? 'neutral' : ''}>{amountPrefix(transaction.type)} {money(transaction.amountMinor, transaction.currency)}</b>
  </article>;
}

function TransactionIcon({ transaction, categories }: { transaction: Transaction; categories: Category[] }) {
  if (transaction.type === 'transfer') return <ArrowLeftRight />;
  const category = categories.find(item => item.id === transaction.categoryId);
  return <CategoryIcon name={category?.icon} color={category?.color} />;
}

function transactionTitle(transaction: Transaction, categories: Category[]) {
  if (transaction.type === 'transfer') return transaction.description || 'Переказ';
  return transaction.description || categories.find(category => category.id === transaction.categoryId)?.name || (transaction.type === 'income' ? 'Надходження' : 'Витрата');
}

function transactionAccountLine(transaction: Transaction, accounts: Account[]) {
  const account = accounts.find(item => item.id === transaction.accountId)?.name || 'Рахунок';
  if (transaction.type !== 'transfer') return account;
  const target = accounts.find(item => item.id === transaction.relatedAccountId)?.name || 'Інший рахунок';
  return `${account} → ${target}`;
}

function categoryName(transaction: Transaction, categories: Category[]) {
  return categories.find(category => category.id === transaction.categoryId)?.name || 'Без категорії';
}

function amountPrefix(type: Transaction['type']) {
  if (type === 'income') return '+';
  if (type === 'expense') return '−';
  return '';
}
