import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { FinanceService } from '../finance/application/finance.service';
import { ExtendedFinanceService } from './extended-finance.service';
import { PeriodQueryDto } from '../../shared/presentation/period-query.dto';

type HeadersMap = Record<string, string | string[] | undefined>;
@Controller()
class PlanningController {
  constructor(private finance: FinanceService, private extended: ExtendedFinanceService) {}
  @Get('budgets') listBudgets() { return this.extended.listBudgets(); }
  @Post('budgets') async createBudget(@Headers() h: HeadersMap, @Body() b: Record<string, unknown>) { return this.extended.createBudget(b, await this.finance.getCurrentUser(h)); }
  @Patch('budgets/:id') async updateBudget(@Param('id') id:string,@Headers() h:HeadersMap,@Body() b:Record<string,unknown>){return this.extended.updateBudget(id,b,await this.finance.getCurrentUser(h));}
  @Delete('budgets/:id') async deleteBudget(@Param('id') id:string,@Headers() h:HeadersMap){return this.extended.deleteBudget(id,await this.finance.getCurrentUser(h));}
  @Get('budgets/:id/progress') progress(@Param('id') id: string) { return this.extended.budgetProgress(id); }
  @Post('budgets/:id/rollover') rollover(@Param('id') id:string){return this.extended.rolloverBudget(id);}
  @Get('recurring') recurring() { return this.finance.listRecurring(); }
  @Post('recurring') async createRecurring(@Headers() h: HeadersMap, @Body() b: Record<string, unknown>) { return this.finance.createRecurring(b as never, await this.finance.getCurrentUser(h)); }
  @Patch('recurring/:id') async updateRecurring(@Param('id') id:string,@Headers() h:HeadersMap,@Body() b:Record<string,unknown>){return this.extended.updateRecurring(id,b,await this.finance.getCurrentUser(h));}
  @Delete('recurring/:id') async deleteRecurring(@Param('id') id:string,@Headers() h:HeadersMap){return this.extended.archiveRecurring(id,await this.finance.getCurrentUser(h));}
  @Get('recurring/occurrences') occurrences(){return this.extended.listOccurrences();}
  @Post('recurring/generate') generate(@Body('days') days?:number){return this.extended.generateOccurrences(days);}
  @Post('recurring/occurrences/:id/confirm') async confirmOccurrence(@Param('id') id:string,@Headers() h:HeadersMap,@Body('accountId') accountId?:string,@Body('amountMinor') amountMinor?:number){const owner=await this.finance.getCurrentUser(h);if(!accountId) return this.extended.confirmOccurrence(id,owner);if(amountMinor===undefined)return this.extended.confirmOccurrence(id,owner,accountId);return this.extended.confirmOccurrenceWithAmount(id,owner,accountId,amountMinor);}
  @Post('recurring/occurrences/:id/skip') skipOccurrence(@Param('id') id:string){return this.extended.skipOccurrence(id);}
  @Get('installments') installments() { return this.extended.listInstallments(); }
  @Post('installments') async createInstallment(@Headers() h: HeadersMap, @Body() b: Record<string, unknown>) { return this.finance.createInstallment(b as never, await this.finance.getCurrentUser(h)); }
  @Patch('installments/:id') async updateInstallment(@Param('id') id:string,@Headers() h:HeadersMap,@Body() b:Record<string,unknown>){return this.finance.updateInstallment(id,b as never,await this.finance.getCurrentUser(h));}
  @Delete('installments/:id') async deleteInstallment(@Param('id') id:string,@Headers() h:HeadersMap){return this.finance.deleteInstallment(id,await this.finance.getCurrentUser(h));}
  @Post('installments/obligations/:id/pay') async pay(@Param('id') id:string,@Headers() h:HeadersMap){return this.extended.payObligation(id,await this.finance.getCurrentUser(h));}
  @Post('installments/:id/repay-early') async repay(@Param('id') id:string,@Headers() h:HeadersMap){return this.extended.repayInstallment(id,await this.finance.getCurrentUser(h));}
  @Get('accounts/:id/credit-terms') creditTerms(@Param('id') id:string){return this.extended.getCreditTerms(id);}
  @Put('accounts/:id/credit-terms') saveCreditTerms(@Param('id') id:string,@Body() b:Record<string,unknown>){return this.extended.saveCreditTerms(id,b);}
  @Get('accounts/:id/credit-summary') creditSummary(@Param('id') id:string){return this.extended.creditSummary(id);}
  @Post('imports/preview') async previewImport(@Headers() h:HeadersMap,@Headers('idempotency-key') key:string|undefined,@Body() b:Record<string,unknown>){return this.extended.previewImport(b,await this.finance.getCurrentUser(h),key);}
  @Get('imports/:id') importReport(@Param('id') id:string){return this.extended.importReport(id);}
  @Post('imports/:id/confirm') async confirmImport(@Param('id') id:string,@Headers() h:HeadersMap){return this.extended.confirmImport(id,await this.finance.getCurrentUser(h));}
  @Post('imports/:id/cancel') cancelImport(@Param('id') id:string){return this.extended.cancelImport(id);}
  @Get('receipts') receipts(){return this.extended.listReceipts();}
  @Post('receipts') async createReceipt(@Headers() h:HeadersMap,@Body() b:Record<string,unknown>){return this.extended.createReceipt(b,await this.finance.getCurrentUser(h));}
  @Post('receipts/:id/ocr') async ocrReceipt(@Param('id') id:string,@Headers() h:HeadersMap){return this.extended.ocrReceipt(id,await this.finance.getCurrentUser(h));}
  @Patch('receipts/:id') updateReceipt(@Param('id') id:string,@Body() b:Record<string,unknown>){return this.extended.updateReceipt(id,b);}
  @Post('receipts/:id/confirm') async confirmReceipt(@Param('id') id:string,@Headers() h:HeadersMap){return this.extended.confirmReceipt(id,await this.finance.getCurrentUser(h));}
  @Post('receipts/:id/cancel') cancelReceipt(@Param('id') id:string){return this.extended.cancelReceipt(id);}
  @Delete('receipts/:id') deleteReceipt(@Param('id') id:string){return this.extended.deleteReceipt(id);}
  @Get('settings') settings(){return this.extended.getSettings();}
  @Put('settings') saveSettings(@Body() b:Record<string,unknown>){return this.extended.saveSettings(b);}
  @Get('export') exportJson(){return this.extended.exportJson();}
  @Get('analytics') analytics(@Query() query: PeriodQueryDto) { return this.finance.analytics(query); }
  @Get('payments') payments(@Query() query: PeriodQueryDto) { return this.extended.listPayments(query); }
}
@Module({ controllers: [PlanningController] }) export class PlanningModule {}
