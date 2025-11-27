import { IsString, IsDateString, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { InvoiceStatus } from '@prisma/client';

export class UpdateInvoiceDto {
  @IsDateString()
  @IsOptional()
  dueDate?: string;

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

  @IsString()
  @IsOptional()
  pdfUrl?: string;

  @IsNumber()
  @IsOptional()
  paidAmount?: number;

  @IsDateString()
  @IsOptional()
  paidAt?: string;
}
