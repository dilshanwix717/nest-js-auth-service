// FILE: apps/auth-service/src/libs/dto/auth-login-response.dto.ts
// ==============================================================
export class AuthLoginResponseDto {
  token: string;

  user: {
    id: string;
    username: string;
    email: string;
    roles: string[];
  };
}
