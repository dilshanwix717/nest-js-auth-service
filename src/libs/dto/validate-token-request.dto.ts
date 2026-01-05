// apps/auth-service/src/libs/dto/validate-token-request.dto.ts
// ==============================================================

import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Request DTO for token validation
 */
export class ValidateTokenRequestDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
