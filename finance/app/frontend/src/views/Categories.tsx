import { useMemo, useState, type FormEvent } from 'react';
import {
  Apple, ArrowLeft, Banknote, Bike, BookOpen, BriefcaseBusiness, Building2,
  Bus, Cake, Camera, Car, ChevronDown, Circle, Coffee, CreditCard, Droplets,
  Dumbbell, Factory, Film, Fish, Fuel, Gift, Gamepad2, GraduationCap,
  Hammer, HandCoins, HeartPulse, Hospital, House, KeyRound, Laptop, Lightbulb,
  Martini, Megaphone, Monitor, Music, Package, PawPrint, Pizza, Plane, Plus,
  Pencil, Receipt, Rocket, Scissors, Send, ShieldCheck, ShoppingBag, ShoppingCart,
  Shirt, Smartphone, Stethoscope, Store, Trash2, Train, TreePine, Tv, Utensils,
  Wallet, Wifi, Wine, Wrench, Zap,
  type LucideIcon,
} from 'lucide-react';
import { financeApi } from '../api/client';
import type { Category } from '../types/finance';

const iconMap: Record<string, LucideIcon> = {
  circle: Circle, briefcase: BriefcaseBusiness, wallet: Wallet, gift: Gift, utensils: Utensils,
  house: House, car: Car, wine: Wine, banknote: Banknote, coffee: Coffee,
  shopping: ShoppingBag, health: HeartPulse, sport: Dumbbell, travel: Plane,
  phone: Smartphone, entertainment: Tv, music: Music, education: GraduationCap,
  clothing: Shirt, pets: PawPrint, bus: Bus, fuel: Fuel, games: Gamepad2, tools: Wrench,
  apple: Apple, bike: Bike, books: BookOpen, building: Building2, cake: Cake,
  camera: Camera, card: CreditCard, water: Droplets, factory: Factory, film: Film,
  fish: Fish, hammer: Hammer, coins: HandCoins, hospital: Hospital, key: KeyRound,
  laptop: Laptop, electricity: Zap, announcement: Megaphone, monitor: Monitor,
  cocktail: Martini, package: Package, pizza: Pizza, receipt: Receipt, rocket: Rocket,
  scissors: Scissors, send: Send, security: ShieldCheck, cart: ShoppingCart,
  doctor: Stethoscope, store: Store, train: Train, nature: TreePine, wifi: Wifi,
  light: Lightbulb,
};
const iconOptions = Object.keys(iconMap);

function CategoryIcon({ name, color }: { name?: string; color?: string }) {
  const Icon = (name && iconMap[name]) || Circle;
  return <Icon size={18} strokeWidth={2.2} style={{ color: color || '#64748b' }} />;
}

export function Categories({ categories, onBack, onChanged }: { categories: Category[]; onBack: () => void; onChanged: () => void }) {
  const [activeType, setActiveType] = useState<'income' | 'expense'>('income');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [icon, setIcon] = useState('circle');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const roots = useMemo(() => categories.filter(c => c.type === activeType && !c.parentId), [categories, activeType]);
  function openCreate(parent: Category | null = null) { setEditingId(null); setName(''); setParentId(parent?.id || ''); setIcon('briefcase'); setShowForm(true); setFormError(''); }
  function openEdit(category: Category) { setEditingId(category.id); setName(category.name); setParentId(category.parentId || ''); setIcon(category.icon); setShowForm(true); setFormError(''); }

  async function createCategory(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true); setFormError('');
    try {
      if (editingId) await financeApi.updateCategory(editingId, { name: name.trim(), parentId: parentId || undefined, icon });
      else await financeApi.createCategory({ name: name.trim(), type: activeType, parentId: parentId || undefined, icon, color: activeType === 'income' ? '#16a34a' : '#ef4444' });
      setName(''); setParentId(''); setIcon('circle'); setEditingId(null); setShowForm(false); onChanged();
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Не вдалося зберегти категорію'); }
    finally { setBusy(false); }
  }

  async function removeCategory(category: Category) {
    if (!window.confirm(`Видалити категорію «${category.name}»?`)) return;
    setFormError('');
    try { await financeApi.deleteCategory(category.id); onChanged(); }
    catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Не вдалося видалити категорію'); }
  }

  return <main className="screen categories-screen">
    <header className="screen-header category-header"><button className="round-action" onClick={onBack}><ArrowLeft /></button><h1>Категорії</h1><button className="round-action" onClick={() => openCreate()}><Plus /></button></header>
    <div className="category-tabs"><button className={activeType === 'income' ? 'active' : ''} onClick={() => setActiveType('income')}>Прибуток</button><button className={activeType === 'expense' ? 'active' : ''} onClick={() => setActiveType('expense')}>Витрата</button></div>
    {formError && <div className="category-error">{formError}</div>}
    <div className="category-list">{roots.length === 0 && <div className="empty-state">Категорій ще немає</div>}{roots.map(root => <section className="category-group" key={root.id}>
      <div className="category-row" style={{ color: root.color }}><CategoryIcon name={root.icon} color={root.color} /><strong>{root.name}</strong><span className="category-spacer" /><button className="category-add-child" onClick={() => openCreate(root)} aria-label={`Додати в ${root.name}`}><Plus size={15} /></button><button className="category-delete" onClick={() => openEdit(root)} aria-label={`Редагувати ${root.name}`}><Pencil size={15} /></button><ChevronDown size={16} /><button className="category-delete" onClick={() => void removeCategory(root)} aria-label={`Видалити ${root.name}`}><Trash2 size={15} /></button></div>
      {categories.filter(category => category.parentId === root.id && category.type === activeType).map(child => <div className="category-child" key={child.id}><CategoryIcon name={child.icon} color={child.color} />{child.name}<span className="category-spacer" /><button className="category-delete" onClick={() => openEdit(child)} aria-label={`Редагувати ${child.name}`}><Pencil size={14} /></button><button className="category-delete" onClick={() => void removeCategory(child)} aria-label={`Видалити ${child.name}`}><Trash2 size={14} /></button></div>)}
    </section>)}</div>
    {showForm && <div className="category-modal-backdrop" onClick={() => setShowForm(false)}><form className="category-modal" onSubmit={createCategory} onClick={event => event.stopPropagation()}><h2>Нова категорія</h2><label>Назва<input value={name} onChange={event => setName(event.target.value)} autoFocus placeholder="Наприклад, Подорожі" /></label><label>Іконка<div className="category-icon-picker">{iconOptions.map(option => { const Icon = iconMap[option]; return <button type="button" key={option} className={icon === option ? 'selected' : ''} onClick={() => setIcon(option)} aria-label={option}><Icon size={20} /></button>; })}</div></label><label>Батьківська категорія<select value={parentId} onChange={event => setParentId(event.target.value)}><option value="">Без батьківської</option>{roots.map(root => <option key={root.id} value={root.id}>{root.name}</option>)}</select></label><div className="category-modal-actions"><button type="button" onClick={() => setShowForm(false)}>Скасувати</button><button className="primary" disabled={busy || !name.trim()}>{busy ? 'Збереження…' : 'Створити'}</button></div></form></div>}
  </main>;
}
