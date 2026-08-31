import { Module } from '@nestjs/common'; import { FinanceApplicationModule } from '../finance/application/finance-application.module'; import { TransactionsController } from './presentation/transactions.controller'; import { TaxReceiptService } from './application/tax-receipt.service';
import { TransfersController } from './presentation/transfers.controller';
@Module({ imports: [FinanceApplicationModule], controllers: [TransactionsController, TransfersController], providers: [TaxReceiptService] }) export class TransactionsModule {}
