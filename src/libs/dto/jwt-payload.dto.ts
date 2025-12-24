// FILE: apps/auth-service/src/libs/dto/jwt-payload.dto.ts
// ========================================================
import { IsString, IsArray } from 'class-validator';

export class JwtPayload {
  @IsString()
  userId!: string;

  @IsArray()
  @IsString({ each: true })
  roles!: string[];
}
