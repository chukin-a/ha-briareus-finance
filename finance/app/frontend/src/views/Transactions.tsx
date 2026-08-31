import { useMemo, useState } from 'react';
import { MoreHorizontal, Pencil, Plus, Trash2, X } from 'lucide-react';
import { financeApi } from '../api/client';
import type { Account, Category, Project, Transaction, TransactionType } from '../types/finance';
import { money, parseMinor, shortDate } from '../lib/money';
import { PeriodPicker, type CustomRange, type PeriodPreset } from '../components/PeriodPicker';
import { CategoryOptions } from '../components/CategoryOptions';
import { CategoryIcon } from '../components/CategoryIcon';

function accountLine(transaction: Transaction, accounts: Account[]) {
  const source = accounts.find(account => account.id === transaction.accountId)?.name || 'Рахунок';
  if (transaction.type !== 'transfer') return source;
  const target = accounts.find(account => account.id === transaction.relatedAccountId)?.name || 'Інший рахунок';
  return `${source} → ${target}`;
}

export function Transactions({ transactions, accounts, categories, projects, period, range, onPeriodChange, onRangeChange, onChanged }: { transactions: Transaction[]; accounts: Account[]; categories: Category[]; projects: Project[]; period: PeriodPreset; range: CustomRange; onPeriodChange: (p: PeriodPreset) => void; onRangeChange: (range: CustomRange) => void; onChanged: () => void }) {
  const [filter, setFilter] = useState<'all' | TransactionType>('all');
  const [open, setOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [type, setType] = useState<TransactionType>('expense');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [relatedAccountId, setRelatedAccountId] = useState(accounts[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const visible = useMemo(() => filter === 'all' ? transactions : transactions.filter(t => t.type === filter), [filter, transactions]);
  const reset = () => { setAmount(''); setDescription(''); setCategoryId(''); setProjectId(''); setError(''); setEditing(null); setOpen(false); setMenuId(null); };
  const edit = (transaction: Transaction) => { setEditing(transaction); setType(transaction.type); setAccountId(transaction.accountId); setAmount(String(transaction.amountMinor / 100).replace('.', ',')); setDescription(transaction.description || ''); setCategoryId(transaction.categoryId || ''); setProjectId(transaction.projectId || ''); setDate(transaction.occurredAt.slice(0, 10)); setError(''); setOpen(true); };
  async function submit() {
    const amountMinor = parseMinor(amount);
    if (!accountId || !Number.isInteger(amountMinor) || amountMinor <= 0) return setError('Вкажіть коректну суму та рахунок');
    if (!editing && type === 'transfer' && (!relatedAccountId || relatedAccountId === accountId)) return setError('Оберіть два різні рахунки');
    try {
      if (editing) await financeApi.updateTransaction(editing.id, { type, accountId, amountMinor, occurredOn: date, description: description.trim() || undefined, categoryId: categoryId || undefined, projectId: projectId || undefined });
      else if (type === 'transfer') await financeApi.createTransfer({ sourceAccountId: accountId, targetAccountId: relatedAccountId, sourceAmountMinor: amountMinor, targetAmountMinor: amountMinor, occurredOn: date, description: description.trim() || undefined });
      else await financeApi.createTransaction({ type, accountId, amountMinor, occurredOn: date, description: description.trim() || undefined, categoryId: categoryId || undefined, projectId: projectId || undefined });
      reset(); onChanged();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не вдалося зберегти операцію'); }
  }
  async function remove(transaction: Transaction) { if (!window.confirm('Видалити цю операцію?')) return; try { await financeApi.deleteTransaction(transaction.id); onChanged(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не вдалося видалити'); } }
  return <main className="screen">
    <header className="screen-header"><div><span className="eyebrow">ЖУРНАЛ ОПЕРАЦІЙ</span><h1>Транзакції</h1></div><button className="round-action" onClick={() => { setEditing(null); setError(''); setOpen(true); }}><Plus /></button></header>
    <div className="transactions-toolbar"><PeriodPicker value={period} range={range} onChange={onPeriodChange} onRangeChange={onRangeChange} /></div>
    <div className="category-tabs transaction-tabs">{(['all', 'income', 'expense', 'transfer'] as const).map(value => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value === 'all' ? 'Всі' : value === 'income' ? 'Прибуток' : value === 'expense' ? 'Витрата' : 'Перекази'}</button>)}</div>
    <div className="transactions full-transactions">{!visible.length && <p className="empty">Операцій за цим періодом немає</p>}{visible.map(transaction => <article className="transaction" key={transaction.id}><time>{shortDate(transaction.occurredAt)}</time><div className={`transaction-icon ${transaction.type}`}>{transaction.type === 'transfer' ? '↔' : <CategoryIcon name={categories.find(category => category.id === transaction.categoryId)?.icon} color={categories.find(category => category.id === transaction.categoryId)?.color} />}</div><div className="transaction-copy"><strong>{transaction.description || categories.find(c => c.id === transaction.categoryId)?.name || (transaction.type === 'income' ? 'Надходження' : transaction.type === 'transfer' ? 'Переказ' : 'Витрата')}</strong><span>{accountLine(transaction, accounts)}</span></div><b className={transaction.type === 'income' ? 'income' : ''}>{transaction.type === 'income' ? '+' : transaction.type === 'transfer' ? '' : '−'} {money(transaction.amountMinor, transaction.currency)}</b><div className="transaction-menu"><button className="transaction-menu-trigger" aria-label="Дії з операцією" onClick={() => setMenuId(menuId === transaction.id ? null : transaction.id)}><MoreHorizontal size={18} /></button>{menuId === transaction.id && <div className="transaction-menu-popover"><button disabled={transaction.type === 'transfer'} onClick={() => { setMenuId(null); edit(transaction); }}><Pencil size={14} />Редагувати</button><button className="danger-action" onClick={() => { setMenuId(null); void remove(transaction); }}><Trash2 size={14} />Видалити</button></div>}</div></article>)}</div>
    {open && <div className="modal"><section><button className="modal-close" onClick={reset}><X /></button><h2>{editing ? 'Редагувати операцію' : 'Нова операція'}</h2><label>Тип<select value={type} disabled={!!editing} onChange={event => { const nextType = event.target.value as TransactionType; setType(nextType); if (nextType !== 'expense') setProjectId(''); }}><option value="expense">Витрата</option><option value="income">Прибуток</option>{!editing && <option value="transfer">Переказ</option>}</select></label><label>Сума<input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0,00" /></label><label>Дата<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label><label>Рахунок<select value={accountId} onChange={event => setAccountId(event.target.value)}>{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>{!editing && type === 'transfer' ? <label>На рахунок<select value={relatedAccountId} onChange={event => setRelatedAccountId(event.target.value)}>{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label> : <label>Категорія<select value={categoryId} onChange={event => setCategoryId(event.target.value)}><option value="">Без категорії</option><CategoryOptions categories={categories} type={type === 'income' ? 'income' : 'expense'} /></select></label>}{type === 'expense' && <label>Проєкт<select value={projectId} onChange={event => setProjectId(event.target.value)}><option value="">Без проєкту</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>}<label>Опис<input value={description} onChange={event => setDescription(event.target.value)} /></label>{error && <p className="form-error">{error}</p>}<button className="primary" onClick={() => void submit()}>{editing ? 'Зберегти зміни' : 'Зберегти'}</button></section></div>}
  </main>;
}
