import { Body, Controller, Get, Headers, Param, Patch } from '@nestjs/common';
import { FinanceService } from '../../finance/application/finance.service';
@Controller()
export class UsersController { constructor(private readonly finance: FinanceService) {} @Get('users') list(@Headers() h: Record<string, string | string[] | undefined>) { return this.finance.listUsers(h); } @Patch('users/:id/access') setAccess(@Param('id') id:string,@Body('blocked') blocked:boolean,@Headers() h: Record<string, string | string[] | undefined>) { return this.finance.setUserAccess(id, Boolean(blocked), h); } @Get('me') me(@Headers() h: Record<string, string | string[] | undefined>) { return this.finance.getCurrentUser(h); } }
