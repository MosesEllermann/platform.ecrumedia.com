import { IsEmail, IsString, IsOptional, MinLength, IsEnum, ValidateIf } from 'class-validator';
import { ClientType } from '@prisma/client';

export class UpdateProfileDto {
  // User fields
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  // Client fields
  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  @IsOptional()
  @IsString()
  name?: string; // Company name

  @IsOptional()
  @IsString()
  vatNumber?: string; // UID

  @IsOptional()
  @IsString()
  homepage?: string;

  // Password change (optional)
  @IsOptional()
  @ValidateIf((o) => o.newPassword && o.newPassword.length > 0)
  @IsString()
  @MinLength(6)
  newPassword?: string;

  @IsOptional()
  @IsString()
  newPasswordConfirm?: string;
}
