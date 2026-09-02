import { ArrowLeft, Archive, Folder } from 'lucide-react';
import type { ProjectDetails as ProjectDetailsData } from '../types/finance';
import { money } from '../lib/money';

export function ProjectDetails({ data, onBack, onArchive }: { data: ProjectDetailsData; onBack: () => void; onArchive: () => void }) {
  const maxMonth = Math.max(1, ...data.monthlyExpenses.map(item => item.amountMinor));
  return <main className="screen project-details-screen"><header className="screen-header"><button className="round-action" onClick={onBack}><ArrowLeft /></button><h1>{data.project.name}</h1><div className="project-detail-actions"><button className="round-action" aria-label="Архівувати проєкт" onClick={onArchive}><Archive /></button></div></header>
    <section className="project-detail-summary"><Folder size={24}/><div><strong>{data.project.name}</strong><small>{money(data.project.spentMinor||0,data.project.currency)} з {money(data.project.plannedAmountMinor,data.project.currency)} · {data.project.percentage||0}%</small></div><progress max="100" value={Math.min(100,data.project.percentage||0)}/></section>
    <section className="section-title"><h2>Витрати за місяцями</h2></section>
    {data.monthlyExpenses.length===0?<div className="empty-state">У проєкті ще немає витрат.</div>:<div className="project-months">{data.monthlyExpenses.map(item=><article key={item.month}><div><time>{item.month}</time><strong>{money(item.amountMinor,item.currency)}</strong></div><progress max={maxMonth} value={item.amountMinor}/></article>)}</div>}
    <section className="section-title"><h2>Транзакції</h2></section>
    {data.transactions.length===0?<div className="empty-state">Транзакцій немає.</div>:<div className="analytics-largest">{data.transactions.map(item=><article key={item.id}><div><strong>{item.description||'Витрата'}</strong><small>{item.occurredOn}</small></div><b>{money(item.amountMinor,item.currency)}</b></article>)}</div>}
  </main>;
}
