import { IsString, IsNotEmpty, IsDateString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus } from '@prisma/client';

export class CreateInvoiceItemDto {
  @IsString()
  @IsOptional()
  productName?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(1)
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
}

export class CreateInvoiceDto {
  @IsString()
  @IsOptional()
  userId?: string; // Deprecated, keep for backward compatibility

  @IsString()
  @IsOptional()
  clientId?: string; // New: reference to Client

  @IsString()
  @IsOptional()
  invoiceNumber?: string; // Optional custom invoice number

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsDateString()
  @IsOptional()
  servicePeriodStart?: string;

  @IsDateString()
  @IsOptional()
  servicePeriodEnd?: string;

  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @IsBoolean()
  @IsOptional()
  isReverseCharge?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
