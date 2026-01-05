// apps/auth-service/src/libs/dto/validate-token-response.dto.ts
// ==============================================================

/**
 * Response DTO for token validation
 */
export class ValidateTokenResponseDto {
  valid: boolean;

  user?: {
    userId: string;
    roles: string[];
  } | null;
}
