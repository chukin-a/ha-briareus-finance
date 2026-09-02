import { ArrowLeftRight, Pencil, Trash2, X } from 'lucide-react';
import type { Account, Category, Transaction } from '../types/finance';
import { money, shortDate } from '../lib/money';
import { CategoryIcon } from './CategoryIcon';
import { AuthorLabel } from './AuthorLabel';

type TaxItem = { name: string; quantity: number | null; priceMinor: number | null; amountMinor: number | null; vatMinor: number | null };

export function TransactionDetailsDialog({ transaction, accounts, categories, taxApiEnabled = false, onClose, onEdit, onDelete, onRefreshTaxReceipt }: {
  transaction: Transaction;
  accounts: Account[];
  categories: Category[];
  taxApiEnabled?: boolean;
  onClose: () => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onRefreshTaxReceipt?: (transaction: Transaction) => void;
}) {
  const category = categories.find(item => item.id === transaction.categoryId);
  const source = accounts.find(item => item.id === transaction.accountId)?.name || 'Рахунок';
  const target = transaction.type === 'transfer' ? accounts.find(item => item.id === transaction.relatedAccountId)?.name || 'Інший рахунок' : null;
  const metadata = metadataOf(transaction);
  const qr = metadata.qr as { id?: string; url?: string; fn?: string } | undefined;
  const items = receiptItems(metadata);
  const title = transaction.description || category?.name || (transaction.type === 'income' ? 'Надходження' : transaction.type === 'transfer' ? 'Переказ' : 'Витрата');
  const prefix = transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '−' : '';

  return <div className="modal" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="transaction-details" role="dialog" aria-modal="true" aria-labelledby="transaction-details-title">
      <button className="modal-close" aria-label="Закрити" onClick={onClose}><X /></button>
      <div className="transaction-details-heading">
        <div className={`transaction-details-icon ${transaction.type}`}>{transaction.type === 'transfer' ? <ArrowLeftRight /> : <CategoryIcon name={category?.icon} color={category?.color} />}</div>
        <div><small>{category?.name || (transaction.type === 'transfer' ? 'Переказ' : 'Без категорії')}</small><h2 id="transaction-details-title">{title}</h2></div>
      </div>
      <strong className={`transaction-details-amount ${transaction.type === 'income' ? 'income' : ''}`}>{prefix} {money(transaction.amountMinor, transaction.currency)}</strong>
      <dl className="transaction-details-grid">
        <div><dt>Дата</dt><dd>{shortDate(transaction.occurredAt)}</dd></div>
        <div><dt>Рахунок</dt><dd>{target ? `${source} → ${target}` : source}</dd></div>
        <div className="transaction-details-author"><dt className="sr-only">Автор</dt><dd><AuthorLabel ownerId={transaction.ownerId} ownerName={transaction.ownerName} /></dd></div>
      </dl>
      {transaction.tags?.length ? <div className="transaction-details-tags">{transaction.tags.map(tag => <span key={tag}>{tag}</span>)}</div> : null}
      {qr && <div className="transaction-details-receipt"><h3>Фіскальний чек</h3><p>{qr.id}{qr.fn ? ` · РРО ${qr.fn}` : ''}</p>{qr.url && <a href={qr.url} target="_blank" rel="noreferrer">Відкрити чек у ДПС</a>}{taxApiEnabled && onRefreshTaxReceipt && <button className="secondary-action" onClick={() => onRefreshTaxReceipt(transaction)}>Оновити дані чека</button>}</div>}
      {items.length > 0 && <div className="receipt-items"><h3>Позиції чека</h3>{items.map((item, index) => <div className="receipt-item" key={`${item.name}-${index}`}><span>{item.name}{item.quantity ? ` · ${item.quantity} шт.` : ''}</span><b>{item.amountMinor === null ? '—' : money(item.amountMinor, transaction.currency)}</b><small>{item.priceMinor === null ? '' : `Ціна: ${money(item.priceMinor, transaction.currency)} `}{item.vatMinor === null ? '' : `· ПДВ: ${money(item.vatMinor, transaction.currency)}`}</small></div>)}</div>}
      {(onEdit || onDelete) && <div className="transaction-detail-actions">{onEdit && <button className="secondary-action" onClick={() => onEdit(transaction)}><Pencil size={15}/>Редагувати</button>}{onDelete && <button className="danger-action" onClick={() => onDelete(transaction)}><Trash2 size={15}/>Видалити</button>}</div>}
    </section>
  </div>;
}

function metadataOf(transaction: Transaction): Record<string, unknown> {
  if (transaction.metadata) return transaction.metadata;
  try { return transaction.metadataJson ? JSON.parse(transaction.metadataJson) as Record<string, unknown> : {}; } catch { return {}; }
}

function receiptItems(metadata: Record<string, unknown>): TaxItem[] {
  const tax = metadata.taxRegister as { items?: unknown } | undefined;
  if (Array.isArray(tax?.items)) return tax.items as TaxItem[];
  return Array.isArray(metadata.items) ? metadata.items as TaxItem[] : [];
}
