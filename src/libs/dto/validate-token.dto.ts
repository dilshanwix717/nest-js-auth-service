// FILE: apps/auth-service/src/libs/dto/validate-token.dto.ts
// =========================================================
export class ValidateTokenResponse {
  valid: boolean;

  user?: {
    userId: string;
    roles: string[];
  } | null;
}
