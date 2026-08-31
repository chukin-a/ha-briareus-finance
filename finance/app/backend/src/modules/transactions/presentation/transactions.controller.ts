import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { FinanceService } from '../../finance/application/finance.service';
import { CreateTransactionDto, TransactionQueryDto, UpdateTransactionDto } from './transaction.dto';
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly finance: FinanceService) {}
  @Get() list(@Query() query: TransactionQueryDto) { return this.finance.listTransactions(query); }
  @Post() async create(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: CreateTransactionDto) { if (body.projectId && body.type !== 'expense') throw new BadRequestException('A project can only be assigned to an expense'); return this.finance.createTransaction(body, await this.finance.getCurrentUser(headers)); }
  @Patch(':id') async update(@Param('id') id: string, @Headers() headers: Record<string, string | string[] | undefined>, @Body() body: UpdateTransactionDto) { return this.finance.updateTransaction(id, body, await this.finance.getCurrentUser(headers)); }
  @Delete(':id') async remove(@Param('id') id: string, @Headers() headers: Record<string, string | string[] | undefined>) { return this.finance.deleteTransaction(id, await this.finance.getCurrentUser(headers)); }
}
