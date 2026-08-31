import { useEffect, useState } from 'react';
import { ArrowLeft, Shield, ShieldOff } from 'lucide-react';
import { financeApi } from '../api/client';
import type { User } from '../types/finance';

function formatDate(value?: string | null) {
  if (!value) return 'Ще не було';
  return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function Users({ onBack }: { onBack: () => void }) {
  const [users,setUsers]=useState<User[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState('');
  async function load() {
    try {
      setError('');
      setUsers(await financeApi.getUsers());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не вдалося завантажити користувачів');
    }
  }
  useEffect(()=>{void load()},[]);
  async function toggle(user: User) {
    try {
      setBusy(user.id);
      await financeApi.setUserAccess(user.id, !user.blocked);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не вдалося змінити доступ');
    } finally {
      setBusy('');
    }
  }
  return <main className="screen users-screen">
    <header className="screen-header"><button className="round-action" onClick={onBack}><ArrowLeft /></button><div><span className="eyebrow">ДОСТУП ДО ADD-ON</span><h1>Користувачі</h1></div><div className="round-action"><Shield /></div></header>
    {error&&<div className="category-error">{error}</div>}
    <section className="users-list">
      {!users.length&&<div className="empty-state">Користувачів ще немає.</div>}
      {users.map(user=><article key={user.id} className={user.blocked?'blocked':''}>
        <div className="user-icon">{user.blocked?<ShieldOff/>:<Shield/>}</div>
        <div className="user-copy"><strong>{user.name}{user.current?' · Ви':''}</strong><span>{user.id}</span><small>Останній вхід: {formatDate(user.lastSeenAt || user.createdAt)}</small></div>
        <b>{user.blocked?'Закрито':'Дозволено'}</b>
        <button disabled={user.current||busy===user.id} onClick={()=>void toggle(user)}>{user.blocked?'Відкрити доступ':'Закрити доступ'}</button>
      </article>)}
    </section>
  </main>;
}
