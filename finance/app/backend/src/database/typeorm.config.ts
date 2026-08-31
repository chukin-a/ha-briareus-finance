import 'reflect-metadata';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { AccountEntity } from './entities/account.entity';
import { CategoryEntity } from './entities/category.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { UserEntity } from './entities/user.entity';
import { ProjectEntity } from './entities/project.entity';
import { InitialFinanceSchema1710000000000 } from './migrations/1710000000000-InitialFinanceSchema';
import { PlanningAndAutomation1710000001000 } from './migrations/1710000001000-PlanningAndAutomation';
import { BudgetEntity } from './entities/budget.entity';
import { RecurringRuleEntity } from './entities/recurring-rule.entity';
import { RecurringOccurrenceEntity } from './entities/recurring-occurrence.entity';
import { InstallmentPlanEntity } from './entities/installment-plan.entity';
import { InstallmentObligationEntity } from './entities/installment-obligation.entity';
import { FinancialPeriods1710000002000 } from './migrations/1710000002000-FinancialPeriods';
import { CompleteFinanceSchema1710000003000 } from './migrations/1710000003000-CompleteFinanceSchema';
import { BudgetPeriodEntity } from './entities/budget-period.entity';
import { CreditCardTermEntity } from './entities/credit-card-term.entity';
import { ImportBatchEntity } from './entities/import-batch.entity';
import { ImportRowEntity } from './entities/import-row.entity';
import { ReceiptEntity } from './entities/receipt.entity';
import { ApplicationSettingEntity } from './entities/application-setting.entity';
import { OutboxEventEntity } from './entities/outbox-event.entity';
import { SchemaRepair1710000004000 } from './migrations/1710000004000-SchemaRepair';
import { InstallmentInterest1710000005000 } from './migrations/1710000005000-InstallmentInterest';
import { TransactionSchemaRepair1710000006000 } from './migrations/1710000006000-TransactionSchemaRepair';
import { UserAccessControl1710000007000 } from './migrations/1710000007000-UserAccessControl';
import { RecurringAccountOptional1710000008000 } from './migrations/1710000008000-RecurringAccountOptional';

export function createDataSourceOptions(): DataSourceOptions {
  return {
    type: 'better-sqlite3',
    database: process.env.DB_PATH ?? './data/finance.sqlite',
    entities: [AccountEntity, CategoryEntity, TransactionEntity, UserEntity, ProjectEntity, BudgetEntity, BudgetPeriodEntity, RecurringRuleEntity, RecurringOccurrenceEntity, InstallmentPlanEntity, InstallmentObligationEntity, CreditCardTermEntity, ImportBatchEntity, ImportRowEntity, ReceiptEntity, ApplicationSettingEntity, OutboxEventEntity],
    migrations: [InitialFinanceSchema1710000000000, PlanningAndAutomation1710000001000, FinancialPeriods1710000002000, CompleteFinanceSchema1710000003000, SchemaRepair1710000004000, InstallmentInterest1710000005000, TransactionSchemaRepair1710000006000, UserAccessControl1710000007000, RecurringAccountOptional1710000008000],
    migrationsRun: true,
    synchronize: false,
  };
}

export function createDataSource() {
  return new DataSource(createDataSourceOptions());
}
