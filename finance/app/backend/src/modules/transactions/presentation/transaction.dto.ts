import { Type } from 'class-transformer';
import { IsIn, IsInt, IsISO4217CurrencyCode, IsISO8601, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';
import { PeriodQueryDto } from '../../../shared/presentation/period-query.dto';

export class CreateTransactionDto {
  @IsUUID() accountId!: string;
  @IsOptional() @IsUUID() relatedAccountId?: string;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsIn(['income', 'expense', 'transfer']) type!: 'income' | 'expense' | 'transfer';
  @IsInt() @Min(1) amountMinor!: number;
  @IsOptional() @IsISO4217CurrencyCode() currency?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsISO8601() occurredAt?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) occurredOn?: string;
  @IsOptional() @IsString() externalKey?: string;
  @IsOptional() @IsUUID() receiptId?: string;
  @IsOptional() tags?: string[];
  @IsOptional() metadata?: Record<string, unknown>;
}
export class UpdateTransactionDto {
  @IsOptional() @IsUUID() accountId?: string; @IsOptional() @IsUUID() relatedAccountId?: string; @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsString() categoryId?: string; @IsOptional() @IsIn(['income', 'expense', 'transfer']) type?: 'income' | 'expense' | 'transfer';
  @IsOptional() @IsInt() @Min(1) amountMinor?: number; @IsOptional() @IsISO4217CurrencyCode() currency?: string;
  @IsOptional() @IsString() description?: string; @IsOptional() @IsISO8601() occurredAt?: string; @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) occurredOn?: string;
  @IsOptional() @IsUUID() receiptId?: string; @IsOptional() tags?: string[]; @IsOptional() metadata?: Record<string, unknown>;
}
export class TransactionQueryDto extends PeriodQueryDto {
  @IsOptional() @IsIn(['income', 'expense', 'transfer']) type?: 'income' | 'expense' | 'transfer';
  @IsOptional() @IsUUID() accountId?: string; @IsOptional() @IsString() categoryId?: string; @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsString() search?: string; @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1; @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 50;
}
