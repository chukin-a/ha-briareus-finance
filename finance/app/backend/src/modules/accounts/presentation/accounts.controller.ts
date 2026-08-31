import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { FinanceService } from '../../finance/application/finance.service';
import { CreateAccountDto, UpdateAccountDto } from './account.dto';
@Controller()
export class AccountsController {
  constructor(private readonly finance: FinanceService) {}
  @Get('accounts') list() { return this.finance.listAccounts(); }
  @Post('accounts') async create(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: CreateAccountDto) { return this.finance.createAccount(body, await this.finance.getCurrentUser(headers)); }
  @Patch('accounts/:accountId') async update(@Param('accountId') id: string, @Headers() headers: Record<string, string | string[] | undefined>, @Body() body: UpdateAccountDto) { return this.finance.updateAccount(id, body, await this.finance.getCurrentUser(headers)); }
  @Post('accounts/:accountId/archive') async archive(@Param('accountId') id: string, @Headers() headers: Record<string, string | string[] | undefined>) { return this.finance.archiveAccount(id, await this.finance.getCurrentUser(headers)); }
  @Post('accounts/:accountId/restore') async restore(@Param('accountId') id: string, @Headers() headers: Record<string, string | string[] | undefined>) { return this.finance.restoreAccount(id, await this.finance.getCurrentUser(headers)); }
  @Delete('accounts/:accountId') async remove(@Param('accountId') id: string, @Headers() headers: Record<string, string | string[] | undefined>) { return this.finance.deleteAccount(id, await this.finance.getCurrentUser(headers)); }
}
