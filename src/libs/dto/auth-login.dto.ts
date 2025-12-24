// FILE: apps/auth-service/src/libs/dto/auth-login.dto.ts
// =======================================================
import { IsEmail, IsString, MinLength } from 'class-validator';

export class AuthLoginRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
