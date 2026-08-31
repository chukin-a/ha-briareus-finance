import { Module } from '@nestjs/common'; import { FinanceApplicationModule } from '../finance/application/finance-application.module'; import { UsersController } from './presentation/users.controller';
@Module({ imports: [FinanceApplicationModule], controllers: [UsersController] }) export class UsersModule {}
