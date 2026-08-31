import { useState } from 'react';
import { ArrowLeft, Archive, Folder, Plus } from 'lucide-react';
import { financeApi } from '../api/client';
import type { Project } from '../types/finance';
import { money, parseMinor } from '../lib/money';
import { Dialog } from '../components/Dialog';

export function Projects({ projects, onBack, onChanged }: { projects: Project[]; onBack: () => void; onChanged: () => void }) {
  const [open,setOpen]=useState(false),[name,setName]=useState(''),[amount,setAmount]=useState(''),[error,setError]=useState('');
  const close=()=>{setOpen(false);setName('');setAmount('');setError('')};
  async function add(){const plannedAmountMinor=parseMinor(amount);if(!name.trim()||!Number.isInteger(plannedAmountMinor)||plannedAmountMinor<0)return setError('Вкажіть назву та коректну суму');try{await financeApi.createProject({name:name.trim(),plannedAmountMinor,currency:'UAH'});close();onChanged()}catch(cause){setError(cause instanceof Error?cause.message:'Не вдалося створити проєкт')}}
  return <main className="screen"><header className="screen-header"><button className="round-action" onClick={onBack}><ArrowLeft /></button><h1>Проєкти</h1><button className="round-action" aria-label="Новий проєкт" onClick={()=>setOpen(true)}><Plus/></button></header><div className="planning-list">{projects.map(project=><article key={project.id}><div><Folder size={20}/><strong>{project.name}</strong><span>{project.percentage||0}%</span></div><progress max="100" value={Math.min(100,project.percentage||0)}/><small>{money(project.spentMinor||0,project.currency)} з {money(project.plannedAmountMinor,project.currency)}</small><button onClick={()=>window.confirm(`Архівувати «${project.name}»?`)&&void financeApi.archiveProject(project.id).then(onChanged)}><Archive size={16}/> Архівувати</button></article>)}</div>{open&&<Dialog title="Новий проєкт" onClose={close}><label>Назва<input autoFocus value={name} onChange={event=>setName(event.target.value)} placeholder="Назва проєкту"/></label><label>Планова сума<input value={amount} inputMode="decimal" onChange={event=>setAmount(event.target.value)} placeholder="0,00"/></label>{error&&<p className="form-error">{error}</p>}<button className="primary" onClick={()=>void add()}>Створити</button></Dialog>}</main>;
}
