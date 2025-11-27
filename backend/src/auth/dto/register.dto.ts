import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Passwort muss mindestens 8 Zeichen lang sein' })
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
