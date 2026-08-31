import {Module} from '@nestjs/common';
import {FinanceApplicationModule} from '../finance/application/finance-application.module';
import {AccountsController} from './presentation/accounts.controller';

@Module({imports: [FinanceApplicationModule], controllers: [AccountsController]})
export class AccountsModule {
}
