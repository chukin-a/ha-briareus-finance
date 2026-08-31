import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AccountsModule } from './modules/accounts/accounts.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { PlanningModule } from './modules/planning/planning.module';

@Module({
  imports: [AccountsModule, CategoriesModule, TransactionsModule, UsersModule, ProjectsModule, PlanningModule],
  controllers: [AppController],
})
export class AppModule {}
