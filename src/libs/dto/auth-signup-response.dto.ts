// FILE: apps/auth-service/src/libs/dto/auth-signup-response.dto.ts
export interface AuthSignUpResponseDto {
  id: string;
  username: string;
  email: string;
  roles: string[];
}
