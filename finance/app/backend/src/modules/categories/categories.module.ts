import { Module } from '@nestjs/common'; import { FinanceApplicationModule } from '../finance/application/finance-application.module'; import { CategoriesController } from './presentation/categories.controller';
@Module({ imports: [FinanceApplicationModule], controllers: [CategoriesController] }) export class CategoriesModule {}
