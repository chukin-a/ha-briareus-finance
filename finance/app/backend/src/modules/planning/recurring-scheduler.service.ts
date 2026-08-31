import { Injectable, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ExtendedFinanceService } from './extended-finance.service';
@Injectable() export class RecurringSchedulerService implements OnApplicationBootstrap,OnModuleDestroy {private timer?:NodeJS.Timeout;constructor(private service:ExtendedFinanceService){}onApplicationBootstrap(){void this.service.generateOccurrences();this.timer=setInterval(()=>void this.service.generateOccurrences(),86400000);}onModuleDestroy(){if(this.timer)clearInterval(this.timer);}}
