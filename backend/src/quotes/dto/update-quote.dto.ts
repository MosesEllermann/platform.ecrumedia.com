import { IsString, IsDateString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { QuoteStatus } from '@prisma/client';

export class UpdateQuoteItemDto {
  @IsString()
  @IsOptional()
  productName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  quantity?: number;

  @IsString()
  @IsOptional()
  unitName?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  unitPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxRate?: number;
}

export class UpdateQuoteDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  quoteNumber?: string;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

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

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateQuoteItemDto)
  items?: UpdateQuoteItemDto[];
}
