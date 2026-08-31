import { IsIn, IsInt, IsISO4217CurrencyCode, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateAccountDto {
  @IsString() @MinLength(1) name!: string;
  @IsIn(['debit_card', 'credit_card', 'cash', 'bank_account']) type!: 'debit_card' | 'credit_card' | 'cash' | 'bank_account';
  @IsOptional() @IsISO4217CurrencyCode() currency?: string;
  @IsOptional() @IsInt() initialBalanceMinor?: number;
  @IsOptional() @IsInt() @Min(0) creditLimitMinor?: number;
  @IsOptional() @IsIn(['next_month_end', 'next_month_day']) gracePeriodRule?: 'next_month_end' | 'next_month_day';
  @IsOptional() @IsInt() @Min(1) @Max(31) gracePeriodDay?: number;
}
export class UpdateAccountDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsIn(['debit_card', 'credit_card', 'cash', 'bank_account']) type?: 'debit_card' | 'credit_card' | 'cash' | 'bank_account';
  @IsOptional() @IsISO4217CurrencyCode() currency?: string;
  @IsOptional() @IsInt() initialBalanceMinor?: number;
  @IsOptional() @IsInt() @Min(0) creditLimitMinor?: number;
  @IsOptional() @IsIn(['next_month_end', 'next_month_day']) gracePeriodRule?: 'next_month_end' | 'next_month_day';
  @IsOptional() @IsInt() @Min(1) @Max(31) gracePeriodDay?: number;
}
