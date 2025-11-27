import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, IsEmail, IsUrl, IsBoolean, MinLength, ValidateIf } from 'class-validator';
import { ClientType } from '@prisma/client';

export class CreateClientDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  clientNumber?: number; // If not provided, will auto-generate

  @IsEnum(ClientType)
  @IsNotEmpty()
  type: ClientType;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  vatNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  countryCode?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsUrl({ require_protocol: false })
  @IsOptional()
  homepage?: string;

  @IsString()
  @IsOptional()
  fixedNote?: string;

  @IsString()
  @IsOptional()
  userId?: string; // Optional link to user account

  @IsBoolean()
  @IsOptional()
  createUserAccount?: boolean; // Create user account and send invitation

  // Password field for updating user password
  @IsOptional()
  @ValidateIf((o) => o.password && o.password.length > 0)
  @IsString()
  @MinLength(6)
  password?: string;
}
