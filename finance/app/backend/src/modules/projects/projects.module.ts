import { Module } from '@nestjs/common';
import { FinanceApplicationModule } from '../finance/application/finance-application.module';
import { ProjectsController } from './presentation/projects.controller';

@Module({ imports: [FinanceApplicationModule], controllers: [ProjectsController] })
export class ProjectsModule {}
