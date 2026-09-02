import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { FinanceService } from '../../finance/application/finance.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly finance: FinanceService) {}
  @Get() list() { return this.finance.listProjects(); }
  @Get(':id') details(@Param('id') id:string) { return this.finance.projectDetails(id); }
  @Post() async create(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: { name: string; plannedAmountMinor?: number; currency?: string }) { return this.finance.createProject(body, await this.finance.getCurrentUser(headers)); }
  @Patch(':id') async update(@Param('id') id:string,@Headers() headers: Record<string, string | string[] | undefined>,@Body() body:Record<string,unknown>){return this.finance.updateProject(id,body,await this.finance.getCurrentUser(headers));}
  @Post(':id/archive') async archive(@Param('id') id:string,@Headers() headers: Record<string, string | string[] | undefined>){return this.finance.archiveProject(id,await this.finance.getCurrentUser(headers));}
  @Delete(':id') async remove(@Param('id') id: string,@Headers() headers: Record<string, string | string[] | undefined>) { return this.finance.deleteProject(id,await this.finance.getCurrentUser(headers)); }
}
