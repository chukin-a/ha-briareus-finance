import { IsIn, IsOptional, Matches } from 'class-validator';
import type { PeriodPreset } from '../domain/period';

export class PeriodQueryDto {
  @IsOptional() @IsIn(['today', 'current_week', 'current_month', 'previous_month', 'next_month', 'current_quarter', 'current_year', 'custom']) preset?: PeriodPreset;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) from?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) to?: string;
}
