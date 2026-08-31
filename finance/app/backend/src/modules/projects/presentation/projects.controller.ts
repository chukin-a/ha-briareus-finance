import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { FinanceService } from '../../finance/application/finance.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly finance: FinanceService) {}
  @Get() list() { return this.finance.listProjects(); }
  @Post() async create(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: { name: string; plannedAmountMinor?: number; currency?: string }) { return this.finance.createProject(body, await this.finance.getCurrentUser(headers)); }
  @Patch(':id') update(@Param('id') id:string,@Body() body:Record<string,unknown>){return this.finance.updateProject(id,body);}
  @Post(':id/archive') archive(@Param('id') id:string){return this.finance.archiveProject(id);}
  @Delete(':id') remove(@Param('id') id: string) { return this.finance.deleteProject(id); }
}
