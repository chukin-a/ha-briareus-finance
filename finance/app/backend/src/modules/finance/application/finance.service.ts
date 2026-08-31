import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { AccountEntity } from '../../../database/entities/account.entity';
import { CategoryEntity } from '../../../database/entities/category.entity';
import { ProjectEntity } from '../../../database/entities/project.entity';
import { TransactionEntity } from '../../../database/entities/transaction.entity';
import { UserEntity } from '../../../database/entities/user.entity';
import { BudgetEntity } from '../../../database/entities/budget.entity';
import { RecurringRuleEntity } from '../../../database/entities/recurring-rule.entity';
import { RecurringOccurrenceEntity } from '../../../database/entities/recurring-occurrence.entity';
import { InstallmentPlanEntity } from '../../../database/entities/installment-plan.entity';
import { InstallmentObligationEntity } from '../../../database/entities/installment-obligation.entity';
import type { RequestOwner } from '../../../shared/domain/request-owner';
import { assertLocalDate, localDateFromIso, resolvePeriod, type PeriodPreset } from '../../../shared/domain/period';

type AccountInput = { name: string; type: 'debit_card' | 'credit_card' | 'cash' | 'bank_account'; currency?: string; initialBalanceMinor?: number; creditLimitMinor?: number; gracePeriodRule?: 'next_month_end' | 'next_month_day'; gracePeriodDay?: number };
type TransactionInput = { accountId: string; relatedAccountId?: string; projectId?: string; categoryId?: string; type: 'income' | 'expense' | 'transfer'; amountMinor: number; currency?: string; description?: string; occurredAt?: string; occurredOn?: string; externalKey?: string };
type InstallmentInput = { accountId: string; name: string; totalAmountMinor: number; installmentCount: number; firstDueDate: string; currency?: string; frequency?: string; feeMinor?: number; interestMode?: 'none' | 'flat' | 'declining'; monthlyRateBps?: number };
type TransactionQuery = { preset?: PeriodPreset; from?: string; to?: string; type?: 'income' | 'expense' | 'transfer'; accountId?: string; categoryId?: string; projectId?: string; search?: string; page?: number; pageSize?: number };
const moneyCurrency = (value?: string) => (value || process.env.CURRENCY || 'UAH').trim().toUpperCase();
const positiveMinor = (value: unknown) => Number.isInteger(value) && (value as number) > 0;

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(AccountEntity) private readonly accounts: Repository<AccountEntity>,
    @InjectRepository(CategoryEntity) private readonly categories: Repository<CategoryEntity>,
    @InjectRepository(ProjectEntity) private readonly projects: Repository<ProjectEntity>,
    @InjectRepository(TransactionEntity) private readonly transactions: Repository<TransactionEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(BudgetEntity) private readonly budgets: Repository<BudgetEntity>,
    @InjectRepository(RecurringRuleEntity) private readonly recurring: Repository<RecurringRuleEntity>,
    @InjectRepository(RecurringOccurrenceEntity) private readonly occurrences: Repository<RecurringOccurrenceEntity>,
    @InjectRepository(InstallmentPlanEntity) private readonly installmentPlans: Repository<InstallmentPlanEntity>,
    @InjectRepository(InstallmentObligationEntity) private readonly obligations: Repository<InstallmentObligationEntity>,
  ) {}

  async getCurrentUser(headers: Record<string, string | string[] | undefined>) { const value = (name: string) => Array.isArray(headers[name]) ? headers[name]![0] : headers[name]; const now = new Date().toISOString(); const owner = { id: value('x-remote-user-id') || process.env.DEV_OWNER_ID || 'local-dev-owner', name: value('x-remote-user-display-name') || value('x-remote-user-name') || process.env.DEV_OWNER_NAME || 'Developer' }; const existing=await this.users.findOneBy({id:owner.id});if(existing?.blocked)throw new ForbiddenException('Access to Briareus Finance is closed for this user');await this.users.save({ ...existing, ...owner, createdAt: existing?.createdAt||now, lastSeenAt: now, blocked: existing?.blocked||false }); return owner; }
  async listUsers(headers: Record<string, string | string[] | undefined>) { const current = await this.getCurrentUser(headers); const users = await this.users.find({ order: { lastSeenAt: 'DESC', createdAt: 'DESC' } }); return users.map(user => ({ ...user, current: user.id === current.id })); }
  async setUserAccess(id: string, blocked: boolean, headers: Record<string, string | string[] | undefined>) { const current = await this.getCurrentUser(headers); if (id === current.id && blocked) throw new BadRequestException('You cannot close access for the current user'); const user = await this.users.findOneBy({ id }); if (!user) throw new NotFoundException('User not found'); user.blocked = blocked; return this.users.save(user); }
  async listAccounts() { const accounts = await this.accounts.find({ where: { archived: false }, order: { name: 'ASC' } }); const transactions = await this.transactions.find(); return accounts.map(account => ({ ...account, balanceMinor: account.initialBalanceMinor + transactions.reduce((sum, tx) => sum + this.accountDelta(account.id, tx), 0) })); }
  async createAccount(input: AccountInput, owner: RequestOwner) { if (!input.name?.trim() || !['debit_card', 'credit_card', 'cash', 'bank_account'].includes(input.type)) throw new BadRequestException('Invalid account'); if (input.type === 'credit_card' && (!Number.isInteger(input.creditLimitMinor) || input.creditLimitMinor! < 0)) throw new BadRequestException('creditLimitMinor is required'); if (input.initialBalanceMinor !== undefined && !Number.isInteger(input.initialBalanceMinor)) throw new BadRequestException('initialBalanceMinor must be an integer'); if (input.gracePeriodRule === 'next_month_day' && (!Number.isInteger(input.gracePeriodDay) || input.gracePeriodDay! < 1 || input.gracePeriodDay! > 31)) throw new BadRequestException('gracePeriodDay must be 1..31'); return this.accounts.save(this.accounts.create({ id: randomUUID(), ownerId: owner.id, name: input.name.trim(), type: input.type, currency: moneyCurrency(input.currency), initialBalanceMinor: input.initialBalanceMinor ?? 0, creditLimitMinor: input.creditLimitMinor ?? null, gracePeriodRule: input.gracePeriodRule ?? null, gracePeriodDay: input.gracePeriodDay ?? null, archived: false, createdAt: new Date().toISOString() })); }
  async updateAccount(id: string, input: Partial<AccountInput>, owner: RequestOwner) { const account = await this.ownedAccount(id, owner); if (input.name !== undefined && !input.name.trim()) throw new BadRequestException('name is required'); Object.assign(account, { ...input, name: input.name?.trim() ?? account.name, currency: input.currency ? moneyCurrency(input.currency) : account.currency }); return this.accounts.save(account); }
  async archiveAccount(id: string, owner: RequestOwner) { const account = await this.ownedAccount(id, owner); account.archived = true; return this.accounts.save(account); }
  async restoreAccount(id:string,owner:RequestOwner){const account=await this.ownedAccount(id,owner);account.archived=false;return this.accounts.save(account);}
  async deleteAccount(id: string, owner: RequestOwner) { await this.ownedAccount(id, owner); if (await this.transactions.count({ where: [{ accountId: id }, { relatedAccountId: id }] })) throw new BadRequestException('Account with transactions cannot be deleted; archive it instead'); await this.accounts.delete(id); return { id, deleted: true }; }
  private async ownedAccount(id: string, owner: RequestOwner) { const account = await this.accounts.findOneBy({ id }); if (!account) throw new NotFoundException('Account not found'); if (account.ownerId !== owner.id) throw new ForbiddenException('Only the account owner can change it'); return account; }
  listCategories() { return this.categories.find({ where:{archived:false},order: { type: 'ASC', sortOrder: 'ASC', name: 'ASC' } }); }
  async createCategory(input: { name: string; type: 'income' | 'expense'; icon?: string; color?: string; parentId?: string }) { if (!input.name?.trim() || !['income', 'expense'].includes(input.type)) throw new BadRequestException('Invalid category'); if (input.parentId && !await this.categories.findOneBy({ id: input.parentId })) throw new NotFoundException('Parent category not found'); return this.categories.save(this.categories.create({ id: `custom-${randomUUID()}`, name: input.name.trim(), type: input.type, parentId: input.parentId || null, icon: input.icon || 'circle', color: input.color || '#ffc35b', sortOrder: 200 })); }
  async updateCategory(id: string, input: { name: string; icon?: string; parentId?: string }) { const category = await this.categories.findOneBy({ id }); if (!category) throw new NotFoundException('Category not found'); if (!input.name?.trim() || input.parentId === id) throw new BadRequestException('Invalid category'); if(input.parentId){const parent=await this.categories.findOneBy({id:input.parentId});if(!parent)throw new NotFoundException('Parent category not found');if(parent.type!==category.type)throw new BadRequestException('Parent category type mismatch');let cursor:CategoryEntity|null=parent;while(cursor?.parentId){if(cursor.parentId===id)throw new BadRequestException('Category cycle is not allowed');cursor=await this.categories.findOneBy({id:cursor.parentId});}}Object.assign(category, { name: input.name.trim(), icon: input.icon || category.icon, parentId: input.parentId || null }); return this.categories.save(category); }
  async archiveCategory(id:string){const category=await this.categories.findOneBy({id});if(!category)throw new NotFoundException('Category not found');category.archived=true;return this.categories.save(category);}
  async deleteCategory(id: string) { if (!await this.categories.findOneBy({ id })) throw new NotFoundException('Category not found'); if (await this.transactions.count({ where: { categoryId: id } })) throw new BadRequestException('Category with transactions cannot be deleted'); if (await this.categories.count({ where: { parentId: id } })) throw new BadRequestException('Delete child categories first'); await this.categories.delete(id); return { id, deleted: true }; }
  async listTransactions(query: TransactionQuery = {}) { const period = query.preset || query.from || query.to ? resolvePeriod(query) : null; const all = await this.transactions.find({ order: { occurredAt: 'DESC', createdAt: 'DESC' } }); const normalizedSearch = query.search?.trim().toLocaleLowerCase(); const filtered = all.filter(tx => tx.type !== 'transfer_in' && (!period || tx.occurredOn >= period.from && tx.occurredOn < period.to) && (!query.type || (query.type === 'transfer' ? tx.type === 'transfer' || tx.type === 'transfer_out' : tx.type === query.type)) && (!query.accountId || tx.accountId === query.accountId || tx.relatedAccountId === query.accountId) && (!query.categoryId || tx.categoryId === query.categoryId) && (!query.projectId || tx.projectId === query.projectId) && (!normalizedSearch || tx.description?.toLocaleLowerCase().includes(normalizedSearch))); const result=filtered.map(tx=>tx.type==='transfer_out'?{...tx,type:'transfer'}:tx); const page = query.page || 1; const pageSize = query.pageSize || 50; return { items: result.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: result.length, period }; }
  async createTransaction(input: TransactionInput, owner: RequestOwner) { if (!['income', 'expense', 'transfer'].includes(input.type) || !positiveMinor(input.amountMinor)) throw new BadRequestException('amountMinor must be a positive integer'); const account = await this.accounts.findOneBy({ id: input.accountId }); if (!account) throw new NotFoundException('Account not found'); if (input.type === 'transfer' && (!input.relatedAccountId || input.relatedAccountId === input.accountId)) throw new BadRequestException('A transfer needs two different accounts'); if (input.relatedAccountId && !await this.accounts.findOneBy({ id: input.relatedAccountId })) throw new NotFoundException('Related account not found'); if (input.categoryId && !await this.categories.findOneBy({ id: input.categoryId })) throw new NotFoundException('Category not found'); if (input.projectId && !await this.projects.findOneBy({ id: input.projectId })) throw new NotFoundException('Project not found'); if (input.externalKey && await this.transactions.findOneBy({ externalKey: input.externalKey })) throw new BadRequestException('A transaction with this externalKey already exists'); const now = new Date().toISOString(); const occurredAt = input.occurredAt || now; const occurredOn = input.occurredOn ? assertLocalDate(input.occurredOn, 'occurredOn') : localDateFromIso(occurredAt); const base = { ownerId: owner.id, accountId: input.accountId, relatedAccountId: input.relatedAccountId || null, projectId: input.projectId || null, categoryId: input.categoryId || null, type: input.type, amountMinor: input.amountMinor, currency: moneyCurrency(input.currency || account.currency), description: input.description?.trim() || null, occurredAt, occurredOn, createdAt: now, updatedAt: now, transferGroupId: input.type === 'transfer' ? randomUUID() : null, externalKey: input.externalKey || null }; return this.transactions.save(this.transactions.create({ id: randomUUID(), ...base })); }
  async updateTransaction(id: string, input: Partial<TransactionInput>, owner: RequestOwner) { const tx = await this.transactions.findOneBy({ id }); if (!tx) throw new NotFoundException('Transaction not found'); if (tx.ownerId !== owner.id) throw new ForbiddenException('Only the transaction owner can change it'); if (input.amountMinor !== undefined && !positiveMinor(input.amountMinor)) throw new BadRequestException('amountMinor must be a positive integer'); const occurredAt = input.occurredAt ?? tx.occurredAt; const occurredOn = input.occurredOn ? assertLocalDate(input.occurredOn, 'occurredOn') : input.occurredAt ? localDateFromIso(input.occurredAt) : tx.occurredOn; Object.assign(tx, input, { occurredAt, occurredOn, updatedAt: new Date().toISOString() }); return this.transactions.save(tx); }
  async deleteTransaction(id: string, owner: RequestOwner) { const tx = await this.transactions.findOneBy({ id }); if (!tx) throw new NotFoundException('Transaction not found'); if (tx.ownerId !== owner.id) throw new ForbiddenException('Only the transaction owner can delete it'); if(tx.transferGroupId)await this.transactions.delete({transferGroupId:tx.transferGroupId});else await this.transactions.delete(id); return { id, deleted: true }; }
  async createTransfer(input:{sourceAccountId:string;targetAccountId:string;sourceAmountMinor:number;targetAmountMinor?:number;occurredOn?:string;description?:string},owner:RequestOwner){if(input.sourceAccountId===input.targetAccountId||!positiveMinor(input.sourceAmountMinor)||input.targetAmountMinor!==undefined&&!positiveMinor(input.targetAmountMinor))throw new BadRequestException('Invalid transfer');const [source,target]=await Promise.all([this.accounts.findOneBy({id:input.sourceAccountId}),this.accounts.findOneBy({id:input.targetAccountId})]);if(!source||!target)throw new NotFoundException('Account not found');const targetAmount=input.targetAmountMinor??input.sourceAmountMinor;if(source.currency!==target.currency&&input.targetAmountMinor===undefined)throw new BadRequestException('targetAmountMinor is required for cross-currency transfer');const now=new Date().toISOString(),occurredOn=input.occurredOn?assertLocalDate(input.occurredOn,'occurredOn'):localDateFromIso(now),group=randomUUID();return this.transactions.manager.transaction(async manager=>{const rows=manager.create(TransactionEntity,[{id:randomUUID(),ownerId:owner.id,accountId:source.id,relatedAccountId:target.id,projectId:null,categoryId:null,type:'transfer_out',amountMinor:input.sourceAmountMinor,currency:source.currency,description:input.description?.trim()||null,occurredAt:now,occurredOn,createdAt:now,updatedAt:now,transferGroupId:group,externalKey:null},{id:randomUUID(),ownerId:owner.id,accountId:target.id,relatedAccountId:source.id,projectId:null,categoryId:null,type:'transfer_in',amountMinor:targetAmount,currency:target.currency,description:input.description?.trim()||null,occurredAt:now,occurredOn,createdAt:now,updatedAt:now,transferGroupId:group,externalKey:null}]);await manager.save(rows);return{transferId:group,source:rows[0],target:rows[1]};});}
  async deleteTransfer(id:string,owner:RequestOwner){const tx=await this.transactions.findOneBy({transferGroupId:id});if(!tx)throw new NotFoundException('Transfer not found');if(tx.ownerId!==owner.id)throw new ForbiddenException('Only the transfer owner can delete it');await this.transactions.delete({transferGroupId:id});return{id,deleted:true};}
  private accountDelta(id: string, tx: TransactionEntity) { if (tx.type === 'income' && tx.accountId === id) return tx.amountMinor; if (tx.type === 'expense' && tx.accountId === id) return -tx.amountMinor; if (tx.type === 'transfer_out'&&tx.accountId===id)return-tx.amountMinor;if(tx.type==='transfer_in'&&tx.accountId===id)return tx.amountMinor;if (tx.type === 'transfer') return tx.accountId === id ? -tx.amountMinor : tx.relatedAccountId === id ? tx.amountMinor : 0; return 0; }
  async listProjects() { const projects=await this.projects.find({where:{status:'active'},order:{name:'ASC'}});const txs=await this.transactions.find({where:{type:'expense'}});return projects.map(p=>{const spentMinor=txs.filter(t=>t.projectId===p.id&&t.currency===p.currency).reduce((s,t)=>s+t.amountMinor,0);return{...p,spentMinor,remainingMinor:p.plannedAmountMinor-spentMinor,percentage:p.plannedAmountMinor?Math.round(spentMinor*100/p.plannedAmountMinor):0};}); }
  async createProject(input: { name: string; plannedAmountMinor?: number; currency?: string }, owner: RequestOwner) { if (!input.name?.trim() || (input.plannedAmountMinor !== undefined && !Number.isInteger(input.plannedAmountMinor))) throw new BadRequestException('Invalid project'); return this.projects.save(this.projects.create({ id: randomUUID(), ownerId: owner.id, name: input.name.trim(), plannedAmountMinor: input.plannedAmountMinor ?? 0, currency: moneyCurrency(input.currency), createdAt: new Date().toISOString(),status:'active',endOn:null })); }
  async updateProject(id:string,input:Record<string,unknown>){const p=await this.projects.findOneBy({id});if(!p)throw new NotFoundException('Project not found');Object.assign(p,input);return this.projects.save(p);}
  async archiveProject(id:string){const p=await this.projects.findOneBy({id});if(!p)throw new NotFoundException('Project not found');p.status='archived';return this.projects.save(p);}
  async deleteProject(id: string) { if (await this.transactions.count({ where: { projectId: id } })) throw new BadRequestException('Project with transactions cannot be deleted'); const result = await this.projects.delete(id); if (!result.affected) throw new NotFoundException('Project not found'); return { id, deleted: true }; }
  listBudgets() { return this.budgets.find({ order: { periodStart: 'DESC', name: 'ASC' } }); }
  async createBudget(input: Partial<BudgetEntity>, owner: RequestOwner) { if (!input.name?.trim() || !input.periodStart || !input.periodEnd || !positiveMinor(input.plannedAmountMinor)) throw new BadRequestException('Invalid budget'); return this.budgets.save(this.budgets.create({ ...input, id: randomUUID(), ownerId: owner.id, name: input.name.trim(), currency: moneyCurrency(input.currency), active: true })); }
  async budgetProgress(id: string) { const budget = await this.budgets.findOneBy({ id }); if (!budget) throw new NotFoundException('Budget not found'); const transactions = await this.transactions.find({ where: { type: 'expense' } }); const spentMinor = transactions.filter(t => t.occurredAt >= budget.periodStart && t.occurredAt <= budget.periodEnd && (!budget.categoryId || t.categoryId === budget.categoryId) && (!budget.projectId || t.projectId === budget.projectId)).reduce((sum, t) => sum + t.amountMinor, 0); return { ...budget, spentMinor, remainingMinor: budget.plannedAmountMinor - spentMinor, percentage: Math.round(spentMinor / budget.plannedAmountMinor * 100) }; }
  listRecurring() { return this.recurring.find({ order: { startDate: 'DESC' } }); }
  async createRecurring(input: Partial<RecurringRuleEntity>, owner: RequestOwner) { if (!input.accountId || !positiveMinor(input.amountMinor) || !input.startDate || !['income', 'expense'].includes(input.type || '') || !['monthly', 'weekly'].includes(input.frequency || '')) throw new BadRequestException('Invalid recurring rule'); const rule = await this.recurring.save(this.recurring.create({ ...input, id: randomUUID(), ownerId: owner.id, currency: moneyCurrency(input.currency), active: true })); await this.occurrences.save(this.occurrences.create({ id: randomUUID(), ruleId: rule.id, dueDate: rule.startDate, status: 'pending', transactionId: null })); return rule; }
  listInstallments() { return this.installmentPlans.find({ order: { firstDueDate: 'ASC' } }); }
  async createInstallment(input: InstallmentInput, owner: RequestOwner) {
    this.validateInstallment(input);
    await this.ensureInstallmentAccount(input.accountId);
    const plan = await this.installmentPlans.save(this.installmentPlans.create({ ...input, id: randomUUID(), ownerId: owner.id, currency: moneyCurrency(input.currency), frequency: input.frequency || 'monthly', feeMinor: input.feeMinor ?? 0, interestMode: input.interestMode ?? 'none', monthlyRateBps: input.monthlyRateBps ?? 0, status: 'active' }));
    const rows = this.installmentRows(plan, 0, plan.totalAmountMinor, plan.installmentCount);
    await this.obligations.save(rows);
    return { ...plan, obligations: rows };
  }
  async updateInstallment(id:string,input:InstallmentInput,owner:RequestOwner){
    const plan=await this.installmentPlans.findOneBy({id});if(!plan)throw new NotFoundException('Installment plan not found');if(plan.ownerId!==owner.id)throw new ForbiddenException('Only the installment owner can change it');
    const next={...plan,...input,interestMode:input.interestMode??plan.interestMode,monthlyRateBps:input.monthlyRateBps??plan.monthlyRateBps};this.validateInstallment(next);
    await this.ensureInstallmentAccount(next.accountId);
    const existing=await this.obligations.find({where:{planId:id},order:{sequenceNumber:'ASC'}}),paid=existing.filter(row=>row.status==='paid');if(next.installmentCount<=paid.length)throw new BadRequestException('installmentCount must exceed the number of paid payments');
    const paidPrincipal=paid.reduce((sum,row)=>sum+row.principalMinor,0),remainingPrincipal=next.totalAmountMinor-paidPrincipal;if(remainingPrincipal<=0)throw new BadRequestException('totalAmountMinor must exceed paid principal');
    Object.assign(plan,next,{currency:moneyCurrency(next.currency)});await this.installmentPlans.save(plan);await this.obligations.delete({planId:id,status:'pending'});
    const future=this.installmentRows(plan,paid.length,remainingPrincipal,plan.installmentCount-paid.length);await this.obligations.save(future);return{...plan,obligations:[...paid,...future]};
  }
  async deleteInstallment(id:string,owner:RequestOwner){const plan=await this.installmentPlans.findOneBy({id});if(!plan)throw new NotFoundException('Installment plan not found');if(plan.ownerId!==owner.id)throw new ForbiddenException('Only the installment owner can delete it');const paid=await this.obligations.count({where:{planId:id,status:'paid'}});await this.obligations.delete({planId:id,status:'pending'});if(paid){plan.status='cancelled';await this.installmentPlans.save(plan);return{id,deleted:false,cancelled:true};}await this.installmentPlans.delete(id);return{id,deleted:true,cancelled:false};}
  private validateInstallment(input:Partial<InstallmentInput>){const mode=input.interestMode??'none',rate=input.monthlyRateBps??0;if(!input.accountId||!input.name?.trim()||!input.firstDueDate||!positiveMinor(input.totalAmountMinor)||!Number.isInteger(input.installmentCount)||input.installmentCount!<1||!['none','flat','declining'].includes(mode)||!Number.isInteger(rate)||rate<0||rate>10000||(mode!=='none'&&rate===0))throw new BadRequestException('Invalid installment plan');assertLocalDate(input.firstDueDate,'firstDueDate');}
  private async ensureInstallmentAccount(accountId:string){const account=await this.accounts.findOneBy({id:accountId});if(!account)throw new NotFoundException('Account not found');if(account.type!=='credit_card')throw new BadRequestException('Installments must be linked to a credit card');}
  private installmentRows(plan:InstallmentPlanEntity,completed:number,principalTotal:number,count:number){let outstanding=principalTotal;return Array.from({length:count},(_,offset)=>{const sequence=completed+offset+1,base=Math.floor(principalTotal/count),principal=base+(offset===count-1?principalTotal-base*count:0),interest=plan.interestMode==='none'?0:this.rateMinor(plan.interestMode==='flat'?plan.totalAmountMinor:outstanding,plan.monthlyRateBps);outstanding-=principal;return this.obligations.create({id:randomUUID(),planId:plan.id,sequenceNumber:sequence,dueDate:this.addMonths(plan.firstDueDate,sequence-1),amountMinor:principal+interest,principalMinor:principal,interestMinor:interest,status:'pending',transactionId:null,paidAt:null});});}
  private rateMinor(amountMinor:number,rateBps:number){return Number((BigInt(amountMinor)*BigInt(rateBps)+5000n)/10000n);}
  private addMonths(date: string, count: number) { const source=new Date(`${date}T00:00:00Z`),day=source.getUTCDate();const target=new Date(Date.UTC(source.getUTCFullYear(),source.getUTCMonth()+count,1));const last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();target.setUTCDate(Math.min(day,last));return target.toISOString().slice(0,10); }
  async analytics(query: { preset?: PeriodPreset; from?: string; to?: string } = {}) {
    const period = resolvePeriod(query);
    const transactions = await this.transactions.find();
    const selected = transactions.filter(t => t.occurredOn >= period.from && t.occurredOn < period.to);
    const grouped = (type: string) => Object.entries(selected.filter(t => t.type === type).reduce<Record<string, number>>((result, t) => {
      result[t.currency] = (result[t.currency] || 0) + t.amountMinor;
      return result;
    }, {})).map(([currency, amountMinor]) => ({ currency, amountMinor }));
    const income = grouped('income');
    const expenses = grouped('expense');
    const currencies = [...new Set([...income, ...expenses].map(row => row.currency))];
    const byCategory = Object.entries(selected.filter(t => t.type === 'expense').reduce<Record<string, number>>((result, t) => {
      const key = `${t.currency}:${t.categoryId || 'uncategorized'}`;
      result[key] = (result[key] || 0) + t.amountMinor;
      return result;
    }, {})).map(([key, amountMinor]) => {
      const [currency, categoryId] = key.split(':');
      return { currency, categoryId, amountMinor };
    }).sort((a, b) => b.amountMinor - a.amountMinor);
    const trend = Object.entries(selected.reduce<Record<string, { date: string; currency: string; incomeMinor: number; expenseMinor: number }>>((result, t) => {
      if (t.type !== 'income' && t.type !== 'expense') return result;
      const key = `${t.occurredOn}:${t.currency}`;
      const row = result[key] || { date: t.occurredOn, currency: t.currency, incomeMinor: 0, expenseMinor: 0 };
      if (t.type === 'income') row.incomeMinor += t.amountMinor;
      if (t.type === 'expense') row.expenseMinor += t.amountMinor;
      result[key] = row;
      return result;
    }, {})).map(([, row]) => row).sort((a, b) => a.date.localeCompare(b.date) || a.currency.localeCompare(b.currency));
    const largestExpenses = selected.filter(t => t.type === 'expense').sort((a, b) => b.amountMinor - a.amountMinor).slice(0, 10).map(t => ({
      id: t.id,
      amountMinor: t.amountMinor,
      currency: t.currency,
      description: t.description,
      occurredOn: t.occurredOn,
      categoryId: t.categoryId,
      accountId: t.accountId,
      projectId: t.projectId,
    }));
    return {
      period,
      income,
      expenses,
      net: currencies.map(code => ({ currency: code, amountMinor: (income.find(row => row.currency === code)?.amountMinor || 0) - (expenses.find(row => row.currency === code)?.amountMinor || 0) })),
      byCategory,
      trend,
      largestExpenses,
    };
  }
}
