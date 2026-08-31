import { useEffect, useState } from 'react';
import { Archive, Folder, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import { financeApi } from '../api/client';
import { CategoryOptions } from '../components/CategoryOptions';
import { Dialog } from '../components/Dialog';
import { InstallmentsPanel } from '../components/InstallmentsPanel';
import { money, parseMinor, shortDate } from '../lib/money';
import type { Account, BudgetProgress, Category, InstallmentPlan, Project, ReceiptDraft, RecurringOccurrence, RecurringRule } from '../types/finance';

type Tab = 'budgets' | 'projects' | 'recurring' | 'installments' | 'imports' | 'receipts';
const toMinor = parseMinor;
const today = () => new Date().toISOString().slice(0, 10);
const nextMonth = () => {
  const value = new Date();
  value.setUTCMonth(value.getUTCMonth() + 1, 1);
  return value.toISOString().slice(0, 10);
};

export function PlanningHub({ accounts, categories, projects, refreshKey, onChanged, onReceiptReady }: {
  accounts: Account[];
  categories: Category[];
  projects: Project[];
  refreshKey: number;
  onBack: () => void;
  onChanged: () => void;
  onReceiptReady: (draft: { receiptId: string; amountMinor: number | null; currency: string; occurredOn: string | null; description: string | null; tags: string[]; metadata: Record<string, unknown> }) => void;
}) {
  const [tab, setTab] = useState<Tab>('budgets');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [budgets, setBudgets] = useState<BudgetProgress[]>([]);
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);
  const [editingBudget, setEditingBudget] = useState<BudgetProgress | null>(null);
  const [occurrences, setOccurrences] = useState<RecurringOccurrence[]>([]);
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [receipts, setReceipts] = useState<ReceiptDraft[]>([]);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState(today());
  const [endDate, setEndDate] = useState(nextMonth());
  const [content, setContent] = useState('');
  const [draft, setDraft] = useState<ReceiptDraft | null>(null);
  const [scope, setScope] = useState<'all' | 'category' | 'project'>('all');
  const [scopeId, setScopeId] = useState('');
  const [cadence, setCadence] = useState('monthly');
  const [rollover, setRollover] = useState(false);
  const [warning, setWarning] = useState('80');
  const [operationType, setOperationType] = useState<'income' | 'expense'>('expense');
  const [recurringCategoryId, setRecurringCategoryId] = useState('');
  const [importFormat, setImportFormat] = useState<'csv' | 'ofx'>('csv');
  const [receiptCategory, setReceiptCategory] = useState('');
  const [receiptProject, setReceiptProject] = useState('');
  const [paymentOccurrence, setPaymentOccurrence] = useState<RecurringOccurrence | null>(null);
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  async function load() {
    try {
      const data = await Promise.all([
        financeApi.getBudgets(),
        financeApi.getRecurring(),
        financeApi.getOccurrences(),
        financeApi.getInstallments(),
        financeApi.getReceipts(),
      ]);
      setBudgets(data[0]);
      setRules(data[1]);
      setOccurrences(data[2]);
      setPlans(data[3]);
      setReceipts(data[4]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Помилка завантаження');
    }
  }
  useEffect(() => { void load(); }, [refreshKey]);

  function switchTab(value: Tab) {
    setTab(value);
    setDialogOpen(false);
    setError('');
  }
  async function createPlanningItem() {
    try {
      const amountMinor = toMinor(amount);
      if (!name.trim() || !Number.isInteger(amountMinor) || amountMinor <= 0) {
        throw new Error('Вкажіть назву та коректну суму');
      }
      if (tab === 'projects') {
        await financeApi.createProject({ name: name.trim(), plannedAmountMinor: amountMinor, currency: 'UAH' });
        onChanged();
      } else if (tab === 'budgets') {
        const budgetBody = {
          name: name.trim(),
          plannedAmountMinor: amountMinor,
          currency: 'UAH',
          periodStart: date,
          periodEnd: endDate,
          cadence,
          rolloverEnabled: rollover,
          warningPercent: Number(warning),
          categoryId: scope === 'category' ? scopeId || null : null,
          projectId: scope === 'project' ? scopeId || null : null,
        };
        if (editingBudget) await financeApi.updateBudget(editingBudget.id, budgetBody);
        else await financeApi.createBudget(budgetBody);
      } else if (tab === 'recurring') {
        const recurringBody = {
          accountId: accountId || undefined,
          type: operationType,
          amountMinor,
          currency: 'UAH',
          frequency: cadence,
          startDate: date,
          description: name,
          categoryId: recurringCategoryId || undefined,
        };
        if (editingRule) await financeApi.updateRecurring(editingRule.id, recurringBody);
        else await financeApi.createRecurring(recurringBody);
      }
      setName('');
      setAmount('');
      setEditingRule(null);
      setEditingBudget(null);
      setRecurringCategoryId('');
      setDialogOpen(false);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не вдалося зберегти');
    }
  }
  async function importFile() {
    try {
      const report = await financeApi.previewImport({ accountId, currency: 'UAH', format: importFormat, content });
      if (window.confirm('Попередній перегляд готовий. Імпортувати нові рядки?')) {
        await financeApi.confirmImport(String(report.id));
      }
      setContent('');
      setDialogOpen(false);
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Помилка імпорту');
    }
  }
  async function upload(file: File) {
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const receipt = await financeApi.createReceipt({ fileName: file.name, mimeType: file.type, dataBase64 });
      const extracted = await financeApi.ocrReceipt(receipt.id);
      onReceiptReady(extracted);
      setDialogOpen(false);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Помилка завантаження');
    }
  }
  async function confirmDraft() {
    if (!draft) return;
    try {
      const amountMinor = toMinor(amount);
      if (!Number.isInteger(amountMinor) || amountMinor <= 0 || !accountId) throw new Error('Вкажіть рахунок та коректну суму');
      await financeApi.updateReceipt(draft.id, {
        merchant: name,
        description: name,
        occurredOn: date,
        amountMinor,
        currency: 'UAH',
        accountId,
        categoryId: receiptCategory || undefined,
        projectId: receiptProject || undefined,
      });
      await financeApi.confirmReceipt(draft.id);
      setDraft(null);
      setName('');
      setAmount('');
      setDialogOpen(false);
      await load();
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Чек не підтверджено');
    }
  }

  const labels: Record<Tab, string> = {
    budgets: 'Бюджети',
    projects: 'Проєкти',
    recurring: 'Регулярні',
    installments: 'Розстрочки',
    imports: 'Імпорт',
    receipts: 'Чеки',
  };
  const actionLabel = tab === 'budgets' ? 'Новий бюджет' : tab === 'projects' ? 'Новий проєкт' : tab === 'recurring' ? 'Нова операція' : tab === 'imports' ? 'Імпортувати' : 'Додати чек';

  return <main className="screen">
    <header className="screen-header">
      <div><span className="eyebrow">КОНТРОЛЬ ВИТРАТ</span><h1>Планування</h1></div>
      <div className="round-action"><Target /></div>
    </header>
    {error && <div className="category-error">{error}</div>}
    <div className="category-tabs planning-tabs">
      {(Object.keys(labels) as Tab[]).map(value => <button key={value} className={tab === value ? 'active' : ''} onClick={() => switchTab(value)}>{labels[value]}</button>)}
    </div>
    {tab !== 'installments' && <div className="panel-actions">
      <button className="primary-action" onClick={() => { setError(''); setEditingBudget(null); if (tab === 'recurring') { setAccountId(''); setEditingRule(null); setRecurringCategoryId(''); } setDialogOpen(true); }}><Plus size={17} />{actionLabel}</button>
    </div>}

    {tab === 'installments' && <InstallmentsPanel accounts={accounts} plans={plans} reload={load} onChanged={onChanged} />}
    {tab === 'projects' && <div className="planning-list">
      {!projects.length && <div className="empty-state">Ще немає проєктів.</div>}
      {projects.map(project => <article key={project.id}><div><Folder size={20} /><strong>{project.name}</strong><span>{project.percentage || 0}%</span></div><progress max="100" value={Math.min(100, project.percentage || 0)} /><small>{money(project.spentMinor || 0, project.currency)} з {money(project.plannedAmountMinor, project.currency)}</small><button onClick={() => window.confirm(`Архівувати «${project.name}»?`) && void financeApi.archiveProject(project.id).then(onChanged)}><Archive size={16} /> Архівувати</button></article>)}
    </div>}
    {tab === 'budgets' && <div className="planning-list">
      {!budgets.length && <div className="empty-state">Ще немає бюджетів.</div>}
      {budgets.map(budget => <article key={budget.id} className={budget.exceeded ? 'budget-over' : ''}>
        <div><strong>{budget.name}</strong><b>{budget.percentage}%</b></div>
        <span>{money(budget.spentMinor, budget.currency)} з {money(budget.plannedAmountMinor, budget.currency)}</span>
        <progress max="100" value={Math.min(100, budget.percentage)} />
        <div><small>{budget.exceeded ? `Перевищено на ${money(Math.abs(budget.remainingMinor), budget.currency)}` : `Залишок: ${money(budget.remainingMinor, budget.currency)}`}</small><span className="planning-actions"><button aria-label="Редагувати бюджет" onClick={() => { setEditingBudget(budget); setName(budget.name); setAmount(String(budget.plannedAmountMinor / 100).replace('.', ',')); setDate(budget.periodStart); setEndDate(budget.periodEnd); setCadence(budget.cadence); setRollover(budget.rolloverEnabled); setWarning(String(budget.warningPercent)); setScope(budget.categoryId ? 'category' : budget.projectId ? 'project' : 'all'); setScopeId(budget.categoryId || budget.projectId || ''); setError(''); setDialogOpen(true); }}><Pencil size={15} /></button><button aria-label="Видалити бюджет" onClick={() => window.confirm(`Видалити бюджет «${budget.name}»?`) && void financeApi.deleteBudget(budget.id).then(load)}><Trash2 size={15} /></button></span></div>
      </article>)}
    </div>}
    {tab === 'recurring' && <>
      <div className="planning-list">{rules.map(rule => <article key={rule.id}><strong>{rule.description || 'Регулярна операція'}</strong><span>{money(rule.amountMinor, rule.currency)} · {rule.frequency} · {rule.accountId ? accounts.find(account => account.id === rule.accountId)?.name || 'Рахунок' : 'Обрати під час оплати'}</span><div><button onClick={() => { setEditingRule(rule); setName(rule.description || ''); setAmount(String(rule.amountMinor / 100).replace('.', ',')); setOperationType(rule.type); setAccountId(rule.accountId || ''); setRecurringCategoryId(rule.categoryId || ''); setCadence(rule.frequency); setDate(rule.startDate); setError(''); setDialogOpen(true); }}>Редагувати</button><button className="danger-action" onClick={() => window.confirm(`Видалити регулярну операцію «${rule.description || 'без назви'}»?`) && void financeApi.deleteRecurring(rule.id).then(load)}>Видалити</button></div></article>)}</div>
      <button className="secondary-action" onClick={() => void financeApi.generateOccurrences().then(load)}>Оновити календар</button>
      <div className="planning-list">{occurrences.filter(item => item.status === 'pending' && rules.some(rule => rule.id === item.ruleId)).map(item => { const rule = rules.find(candidate => candidate.id === item.ruleId); const amountMinor = item.amountMinor ?? rule?.amountMinor ?? 0; const rawTitle = item.description?.trim() || rule?.description?.trim() || 'Регулярна операція'; const title = rawTitle === item.dueDate ? 'Регулярна операція' : rawTitle; return <article key={item.id}><strong>{title}</strong><span>{shortDate(`${item.dueDate}T12:00:00Z`)} · {money(amountMinor, rule?.currency || 'UAH')}</span><div><button onClick={() => { setPaymentOccurrence(item); setPaymentAccountId(rule?.accountId || accounts[0]?.id || ''); setPaymentAmount(String(amountMinor / 100).replace('.', ',')); }}>Підтвердити</button><button onClick={() => void financeApi.skipOccurrence(item.id).then(load)}>Пропустити</button></div></article>; })}</div>
    </>}
    {tab === 'receipts' && <div className="planning-list">{receipts.map(receipt => <article key={receipt.id}><strong>{receipt.fileName}</strong><span>{receipt.status}</span></article>)}</div>}

    {dialogOpen && tab === 'budgets' && <Dialog title={editingBudget ? 'Редагувати бюджет' : 'Новий бюджет'} onClose={() => { setEditingBudget(null); setDialogOpen(false); }}>
      <div className="planning-form">
        <label>Назва<input value={name} onChange={event => setName(event.target.value)} placeholder="Наприклад, Продукти" /></label>
        <label>Ліміт, ₴<input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0,00" /></label>
        <label>Для чого<select value={scope} onChange={event => { setScope(event.target.value as typeof scope); setScopeId(''); }}><option value="all">Загальний бюджет</option><option value="category">Категорія</option><option value="project">Проєкт</option></select></label>
        {scope === 'category' && <label>Категорія<select value={scopeId} onChange={event => setScopeId(event.target.value)}><option value="">Оберіть категорію</option><CategoryOptions categories={categories} type="expense" /></select></label>}
        {scope === 'project' && <label>Проєкт<select value={scopeId} onChange={event => setScopeId(event.target.value)}><option value="">Оберіть проєкт</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>}
        <label>Період<select value={cadence} onChange={event => setCadence(event.target.value)}><option value="monthly">Місяць</option><option value="quarterly">Квартал</option><option value="custom">Довільний</option></select></label>
        <div className="date-pair"><label>Початок<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label><label>Кінець<input type="date" value={endDate} onChange={event => setEndDate(event.target.value)} /></label></div>
        <label>Попередити на, %<input type="number" min="1" max="100" value={warning} onChange={event => setWarning(event.target.value)} /></label>
        <label className="check-row"><input type="checkbox" checked={rollover} onChange={event => setRollover(event.target.checked)} />Переносити невикористаний залишок</label>
        <button className="primary" onClick={() => void createPlanningItem()}>{editingBudget ? 'Зберегти зміни' : 'Створити бюджет'}</button>
      </div>
    </Dialog>}
    {dialogOpen && tab === 'projects' && <Dialog title="Новий проєкт" onClose={() => setDialogOpen(false)}>
      <div className="planning-form"><label>Назва<input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="Назва проєкту" /></label><label>Планова сума<input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0,00" /></label><button className="primary" onClick={() => void createPlanningItem()}>Створити</button></div>
    </Dialog>}
    {dialogOpen && tab === 'recurring' && <Dialog title={editingRule ? 'Редагування регулярної операції' : 'Регулярна операція'} onClose={() => { setEditingRule(null); setDialogOpen(false); }}>
      <div className="planning-form">
        <label>Опис<input value={name} onChange={event => setName(event.target.value)} /></label>
        <label>Сума<input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} /></label>
        <label>Тип<select value={operationType} onChange={event => setOperationType(event.target.value as typeof operationType)}><option value="income">Прибуток</option><option value="expense">Витрата</option></select></label>
        <label>Рахунок<select value={accountId} onChange={event => setAccountId(event.target.value)}><option value="">Обрати під час оплати</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
        <label>Категорія<select value={recurringCategoryId} onChange={event => setRecurringCategoryId(event.target.value)}><option value="">Без категорії</option><CategoryOptions categories={categories} type={operationType} /></select></label>
        <label>Періодичність<select value={cadence} onChange={event => setCadence(event.target.value)}><option value="weekly">Щотижня</option><option value="monthly">Щомісяця</option><option value="quarterly">Щокварталу</option><option value="yearly">Щороку</option></select></label>
        <label>Початок<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
        <button className="primary" onClick={() => void createPlanningItem()}>{editingRule ? 'Зберегти зміни' : 'Створити правило'}</button>
      </div>
    </Dialog>}
    {paymentOccurrence && <Dialog title="Сплатити регулярну операцію" onClose={() => setPaymentOccurrence(null)}><div className="planning-form"><label>Сума<input inputMode="decimal" value={paymentAmount} onChange={event => setPaymentAmount(event.target.value)} /></label><label>Рахунок<select value={paymentAccountId} onChange={event => setPaymentAccountId(event.target.value)}><option value="">Оберіть рахунок</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><button className="primary" disabled={!paymentAccountId||!Number.isInteger(parseMinor(paymentAmount))||parseMinor(paymentAmount)<=0} onClick={() => void financeApi.confirmOccurrence(paymentOccurrence.id, paymentAccountId, parseMinor(paymentAmount)).then(() => { setPaymentOccurrence(null); void load(); onChanged(); })}>Підтвердити платіж</button></div></Dialog>}
    {dialogOpen && tab === 'imports' && <Dialog title="Імпорт виписки" onClose={() => setDialogOpen(false)}>
      <div className="planning-form">
        <label>Формат<select value={importFormat} onChange={event => setImportFormat(event.target.value as typeof importFormat)}><option value="csv">CSV</option><option value="ofx">OFX</option></select></label>
        <label>Рахунок<select value={accountId} onChange={event => setAccountId(event.target.value)}><option value="">Оберіть рахунок</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
        <label>Файл<input type="file" accept=".csv,.ofx,text/csv,application/x-ofx" onChange={event => { const file = event.target.files?.[0]; if (file) { setImportFormat(file.name.toLowerCase().endsWith('.ofx') ? 'ofx' : 'csv'); void file.text().then(setContent); } }} /></label>
        <label>Вміст<textarea rows={8} value={content} onChange={event => setContent(event.target.value)} /></label>
        <button className="primary" disabled={!content || !accountId} onClick={() => void importFile()}>Перевірити та імпортувати</button>
      </div>
    </Dialog>}
    {dialogOpen && tab === 'receipts' && <Dialog title="Новий чек" onClose={() => setDialogOpen(false)}>
      <div className="planning-form">
        <label>Фото чека<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={event => event.target.files?.[0] && void upload(event.target.files[0])} /></label>
        {draft && <>
          <label>Магазин / опис<input value={name} onChange={event => setName(event.target.value)} /></label>
          <label>Сума<input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} /></label>
          <label>Дата<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
          <label>Рахунок<select value={accountId} onChange={event => setAccountId(event.target.value)}><option value="">Оберіть рахунок</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
          <label>Категорія<select value={receiptCategory} onChange={event => setReceiptCategory(event.target.value)}><option value="">Без категорії</option><CategoryOptions categories={categories} type="expense" /></select></label>
          <label>Проєкт<select value={receiptProject} onChange={event => setReceiptProject(event.target.value)}><option value="">Без проєкту</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <button className="primary" onClick={() => void confirmDraft()}>Підтвердити чек</button>
        </>}
      </div>
    </Dialog>}
  </main>;
}
