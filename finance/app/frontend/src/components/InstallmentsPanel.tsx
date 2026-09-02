import {useState} from 'react';
import {Pencil, Plus, Trash2} from 'lucide-react';
import {financeApi} from '../api/client';
import {money, parseMinor} from '../lib/money';
import type {Account, InstallmentPlan} from '../types/finance';
import {Dialog} from './Dialog';
import {AuthorLabel} from './AuthorLabel';

const basisPoints = parseMinor;
const rateText = (bps: number) => `${Math.floor(bps / 100)}${bps % 100 ? `,${String(bps % 100).padStart(2, '0')}` : ''}`;
const today = () => new Date().toISOString().slice(0, 10);

export function InstallmentsPanel({accounts, plans, reload, onChanged}: {
    accounts: Account[];
    plans: InstallmentPlan[];
    reload: () => Promise<void>;
    onChanged: () => void
}) {
    const creditAccounts = accounts.filter(account => account.type === 'credit_card');
    const accountName = (id: string) => accounts.find(account => account.id === id)?.name || 'Рахунок не знайдено';
    const [open, setOpen] = useState(false), [editing, setEditing] = useState<InstallmentPlan | null>(null), [name, setName] = useState(''), [amount, setAmount] = useState(''), [accountId, setAccountId] = useState(creditAccounts[0]?.id || ''), [count, setCount] = useState('6'), [date, setDate] = useState(today()), [mode, setMode] = useState<'none' | 'flat' | 'declining'>('none'), [rate, setRate] = useState('0'), [error, setError] = useState('');
    const reset = () => {
        setOpen(false);
        setEditing(null);
        setName('');
        setAmount('');
        setCount('6');
        setDate(today());
        setMode('none');
        setRate('0');
        setError('')
    };
    const create = () => {
        reset();
        setAccountId(creditAccounts[0]?.id || '');
        setOpen(true)
    };
    const edit = (plan: InstallmentPlan) => {
        setEditing(plan);
        setName(plan.name);
        setAmount(String(plan.totalAmountMinor / 100));
        setAccountId(plan.accountId);
        setCount(String(plan.installmentCount));
        setDate(plan.firstDueDate);
        setMode(plan.interestMode || 'none');
        setRate(rateText(plan.monthlyRateBps || 0));
        setError('');
        setOpen(true)
    };

    async function submit() {
        try {
            const totalAmountMinor = parseMinor(amount), monthlyRateBps = basisPoints(rate);
            if (!name.trim() || !accountId || !Number.isInteger(totalAmountMinor) || totalAmountMinor <= 0 || !Number.isInteger(monthlyRateBps) || monthlyRateBps < 0 || Number(count) < 1) throw new Error('Перевірте суму, ставку, кількість платежів і рахунок');
            const body = {
                accountId,
                name: name.trim(),
                totalAmountMinor,
                installmentCount: Number(count),
                firstDueDate: date,
                currency: 'UAH',
                frequency: 'monthly',
                interestMode: mode,
                monthlyRateBps: mode === 'none' ? 0 : monthlyRateBps
            };
            if (editing) await financeApi.updateInstallment(editing.id, body); else await financeApi.createInstallment(body);
            reset();
            await reload();
            onChanged()
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Не вдалося зберегти розстрочку')
        }
    }

    async function remove(plan: InstallmentPlan) {
        if (!window.confirm(`Видалити розстрочку «${plan.name}»? Оплачені операції залишаться в історії.`)) return;
        try {
            await financeApi.deleteInstallment(plan.id);
            await reload();
            onChanged()
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Не вдалося видалити розстрочку')
        }
    }

    return <>
        <div className="panel-actions">
            <button type="button" onClick={create}><Plus size={17}/> Нова розстрочка</button>
        </div>
        <div className="planning-list">{plans.map(plan => <article key={plan.id}>
            <div>
                <strong>{plan.name}</strong><span>{plan.interestMode === 'none' ? 'Без відсотків' : `${rateText(plan.monthlyRateBps)}% на місяць`}</span>
            </div>
            <span>{accountName(plan.accountId)} · {money(plan.totalAmountMinor, plan.currency)} · {plan.installmentCount} платежів</span>
            <AuthorLabel ownerId={plan.ownerId} ownerName={plan.ownerName}/>
            {plan.obligations?.map(obligation =>
            <div key={obligation.id}>
                <small>№{obligation.sequenceNumber} · {obligation.dueDate} · {money(obligation.amountMinor, plan.currency)}{obligation.interestMinor ? ` (відсотки ${money(obligation.interestMinor, plan.currency)})` : ''}</small>{obligation.status !== 'paid' &&
                <button onClick={() => void financeApi.payObligation(obligation.id).then(() => {
                    reload();
                    onChanged()
                })}>Сплатити</button>}</div>)}
            <div className="installment-actions">
                <button type="button" onClick={() => edit(plan)}><Pencil size={15}/> Редагувати</button>
                <button type="button" onClick={() => void remove(plan)}><Trash2 size={15}/> Видалити</button>
            </div>
        </article>)}</div>
        {open && <Dialog title={editing ? `Редагування: ${editing.name}` : 'Нова розстрочка'} onClose={reset}><label>Назва<input
            autoFocus value={name} onChange={event => setName(event.target.value)}
            placeholder="Покупка"/></label><label>Сума покупки<input inputMode="decimal" value={amount}
                                                                     onChange={event => setAmount(event.target.value)}
                                                                     placeholder="0,00"/></label><label>Кредитна
            картка<select value={accountId} onChange={event => setAccountId(event.target.value)}>
                <option value="">Оберіть кредитну картку</option>
                {creditAccounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select></label><label>Кількість платежів<input type="number" min="1" value={count}
                                                             onChange={event => setCount(event.target.value)}/></label><label>Перший
            платіж<input type="date" value={date} onChange={event => setDate(event.target.value)}/></label><label>Нарахування
            відсотків<select value={mode} onChange={event => setMode(event.target.value as typeof mode)}>
                <option value="none">Без відсотків</option>
                <option value="flat">На початкову суму</option>
                <option value="declining">На залишок боргу</option>
            </select></label>{mode !== 'none' && <label>Місячна ставка, %<input inputMode="decimal" value={rate}
                                                                                onChange={event => setRate(event.target.value)}
                                                                                placeholder="0,00"/></label>}{error &&
            <p className="form-error">{error}</p>}
            <button className="primary" disabled={!accountId}
                    onClick={() => void submit()}>{editing ? 'Перерахувати майбутні платежі' : 'Створити графік'}</button>
        </Dialog>}
    </>;
}
