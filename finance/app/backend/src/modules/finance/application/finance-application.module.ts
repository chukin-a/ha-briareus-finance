import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createDataSourceOptions } from '../../../database/typeorm.config';
import { FinanceService } from './finance.service';
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
import { BudgetPeriodEntity } from '../../../database/entities/budget-period.entity';
import { CreditCardTermEntity } from '../../../database/entities/credit-card-term.entity';
import { ImportBatchEntity } from '../../../database/entities/import-batch.entity';
import { ImportRowEntity } from '../../../database/entities/import-row.entity';
import { ReceiptEntity } from '../../../database/entities/receipt.entity';
import { ApplicationSettingEntity } from '../../../database/entities/application-setting.entity';
import { OutboxEventEntity } from '../../../database/entities/outbox-event.entity';
import { ExtendedFinanceService } from '../../planning/extended-finance.service';
import { HomeAssistantService } from '../../home-assistant/home-assistant.service';
import { RecurringSchedulerService } from '../../planning/recurring-scheduler.service';
import { RealtimeEventsService } from '../../../shared/realtime/realtime-events.service';

@Global()
@Module({ imports: [TypeOrmModule.forRoot(createDataSourceOptions()), TypeOrmModule.forFeature([AccountEntity, CategoryEntity, ProjectEntity, TransactionEntity, UserEntity, BudgetEntity, BudgetPeriodEntity, RecurringRuleEntity, RecurringOccurrenceEntity, InstallmentPlanEntity, InstallmentObligationEntity, CreditCardTermEntity, ImportBatchEntity, ImportRowEntity, ReceiptEntity, ApplicationSettingEntity, OutboxEventEntity])], providers: [FinanceService, ExtendedFinanceService, HomeAssistantService, RecurringSchedulerService, RealtimeEventsService], exports: [FinanceService, ExtendedFinanceService, RealtimeEventsService] })
export class FinanceApplicationModule {}
