import { IsString, IsNotEmpty, IsDateString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { QuoteStatus } from '@prisma/client';

export class CreateQuoteItemDto {
  @IsString()
  @IsOptional()
  productName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsString()
  @IsOptional()
  unitName?: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxRate?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number; // Item-level discount percentage
}

export class CreateQuoteDto {
  @IsString()
  @IsOptional()
  userId?: string; // Deprecated, keep for backward compatibility

  @IsString()
  @IsOptional()
  clientId?: string; // Reference to Client

  @IsString()
  @IsOptional()
  quoteNumber?: string; // Optional custom quote number

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsNotEmpty()
  validUntil: string;

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

  @IsNumber()
  @IsOptional()
  @Min(0)
  globalDiscount?: number; // Global discount percentage

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteItemDto)
  items: CreateQuoteItemDto[];
}
