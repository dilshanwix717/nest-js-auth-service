// FILE: apps/auth-service/src/app.controller.ts
// ============================================
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import type { AuthLoginRequestDto } from './libs/dto/auth-login.dto';
import type { AuthLoginResponseDto } from './libs/dto/auth-login-response.dto';
import type { ValidateTokenResponse } from './libs/dto/validate-token.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('auth-login')
  async login(
    @Payload() credential: AuthLoginRequestDto,
  ): Promise<AuthLoginResponseDto> {
    return this.appService.login(credential);
  }

  @MessagePattern('validate-token')
  async validateToken(
    @Payload() token: string,
  ): Promise<ValidateTokenResponse> {
    return this.appService.validateToken(token);
  }
}
