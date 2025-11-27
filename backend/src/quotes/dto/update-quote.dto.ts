import { IsString, IsDateString, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { QuoteStatus } from '@prisma/client';

export class UpdateQuoteDto {
  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsDateString()
  @IsOptional()
  servicePeriodStart?: string;

  @IsDateString()
  @IsOptional()
  servicePeriodEnd?: string;

  @IsEnum(QuoteStatus)
  @IsOptional()
  status?: QuoteStatus;

  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @IsBoolean()
  @IsOptional()
  isReverseCharge?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  pdfUrl?: string;
}
