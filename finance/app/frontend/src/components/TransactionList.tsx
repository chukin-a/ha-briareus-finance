import { ArrowLeftRight, CircleMinus, CirclePlus, Pizza } from 'lucide-react';
import type { Account, Category, Transaction } from '../types/finance';
import { money, shortDate } from '../lib/money';

function IconFor({ transaction }: { transaction: Transaction }) {
  if (transaction.type === 'transfer') return <ArrowLeftRight />;
  if (transaction.type === 'income') return <CirclePlus />;
  return transaction.description?.toLowerCase().includes('еда') ? <Pizza /> : <CircleMinus />;
}

function titleFor(transaction: Transaction, categories: Category[]) {
  if (transaction.type === 'transfer') return transaction.description || 'Переказ';
  return transaction.description || categories.find(category => category.id === transaction.categoryId)?.name || (transaction.type === 'income' ? 'Надходження' : 'Витрата');
}

function accountLine(transaction: Transaction, accounts: Account[]) {
  const account = accounts.find(item => item.id === transaction.accountId)?.name || 'Рахунок';
  if (transaction.type !== 'transfer') return account;
  const target = accounts.find(item => item.id === transaction.relatedAccountId)?.name || 'Інший рахунок';
  return `${account} → ${target}`;
}

function amountPrefix(type: Transaction['type']) {
  if (type === 'income') return '+';
  if (type === 'expense') return '−';
  return '';
}

export function TransactionList({ transactions, accounts, categories }: { transactions: Transaction[]; accounts: Account[]; categories: Category[] }) {
  if (!transactions.length) return <p className="empty">Операцій за період немає</p>;
  return <div className="transactions">{transactions.slice(0, 12).map((transaction, index) => <article className="transaction" key={transaction.id}>
    {index === 0 && <time>{shortDate(transaction.occurredAt)}</time>}
    <div className={`transaction-icon ${transaction.type}`}><IconFor transaction={transaction} /></div>
    <div className="transaction-copy"><strong>{titleFor(transaction, categories)}</strong><span>{accountLine(transaction, accounts)}</span></div>
    <b className={transaction.type === 'income' ? 'income' : transaction.type === 'transfer' ? 'neutral' : ''}>{amountPrefix(transaction.type)} {money(transaction.amountMinor, transaction.currency)}</b>
  </article>)}</div>;
}
