import { ArrowLeft, Archive, Folder } from 'lucide-react';
import { useState } from 'react';
import type { Account, Category, ProjectDetails as ProjectDetailsData } from '../types/finance';
import { money } from '../lib/money';
import { TransactionList } from '../components/TransactionList';
import type { Transaction } from '../types/finance';
import { AuthorLabel } from '../components/AuthorLabel';
import { TransactionDetailsDialog } from '../components/TransactionDetailsDialog';
import { ProgressBar } from '../components/ProgressBar';

export function ProjectDetails({ data, accounts, categories, onBack, onArchive }: { data: ProjectDetailsData; accounts: Account[]; categories: Category[]; onBack: () => void; onArchive: () => void }) {
  const [selectedTransaction,setSelectedTransaction]=useState<Transaction|null>(null);
  const monthly=data.monthlyExpenses.filter(item=>item.amountMinor>0);
  const maxMonth=Math.max(1,...monthly.map(item=>item.amountMinor));
  const transactions=data.transactions.map(item => ({ ...item, type: 'expense' as const, relatedAccountId: null, occurredAt: `${item.occurredOn}T12:00:00.000Z` })) as Transaction[];
  return <main className="screen project-details-screen"><header className="screen-header"><button className="round-action" onClick={onBack}><ArrowLeft /></button><h1>{data.project.name}</h1><div className="project-detail-actions"><button className="round-action" aria-label="Архівувати проєкт" onClick={onArchive}><Archive /></button></div></header>
    <section className="project-detail-summary"><Folder size={24}/><div><strong>{data.project.name}</strong><small>{money(data.project.spentMinor||0,data.project.currency)} з {money(data.project.plannedAmountMinor,data.project.currency)} · {data.project.percentage||0}%</small><AuthorLabel ownerId={data.project.ownerId} ownerName={data.project.ownerName}/></div><ProgressBar value={data.project.percentage||0}/></section>
    <section className="section-title"><h2>Витрати за місяцями</h2></section>
    {monthly.length===0?<div className="empty-state">У проєкті ще немає витрат.</div>:<div className="budget-month-chart project-month-chart">{monthly.map(item=><article key={item.month}><div className="budget-month-bar"><span style={{height:`${item.amountMinor/maxMonth*100}%`}}/></div><time>{item.month.slice(5)}/{item.month.slice(2,4)}</time><strong>{money(item.amountMinor,item.currency)}</strong></article>)}</div>}
    <section className="section-title"><h2>Транзакції</h2></section>
    <TransactionList accounts={accounts} categories={categories} limit={transactions.length} transactions={transactions} onTransactionClick={setSelectedTransaction}/>
    {selectedTransaction&&<TransactionDetailsDialog transaction={selectedTransaction} accounts={accounts} categories={categories} onClose={()=>setSelectedTransaction(null)}/>}
  </main>;
}
