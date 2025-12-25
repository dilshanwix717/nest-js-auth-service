// apps/auth-service/src/app.controller.ts
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import { AppService } from './app.service';
import { RpcPayload } from './common/decorators/rpc-payload.decorator';
import type { AuthLoginRequestDto } from './libs/dto/auth-login.dto';
import type { AuthLoginResponseDto } from './libs/dto/auth-login-response.dto';
import type { ValidateTokenResponse } from './libs/dto/validate-token.dto';
import type { AuthSignUpRequestDto } from './libs/dto/auth-signup.dto';
import type { AuthSignUpResponseDto } from './libs/dto/auth-signup-response.dto';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @MessagePattern('auth-signup')
  async signUp(
    @RpcPayload() dto: AuthSignUpRequestDto,
  ): Promise<AuthSignUpResponseDto> {
    // 🔍 LOG INCOMING MESSAGE
    this.logger.log('Received auth-signup message:', {
      username: dto.username,
      email: dto.email,
      roles: dto.roles,
    });

    try {
      const result = await this.appService.signUp(dto);

      // 🔍 LOG SUCCESS
      this.logger.log('Signup successful:', result);

      return result;
    } catch (error) {
      // 🔍 LOG AND THROW RPC EXCEPTION
      this.logger.error('Signup error:', error);
      throw new RpcException({
        status: 'error',
        message: error instanceof Error ? error.message : 'Signup failed',
      });
    }
  }

  @MessagePattern('auth-login')
  async login(
    @RpcPayload() credential: AuthLoginRequestDto,
  ): Promise<AuthLoginResponseDto> {
    this.logger.log('Received auth-login message:', credential.email);

    try {
      return await this.appService.login(credential);
    } catch (error) {
      this.logger.error('Login error:', error);
      throw new RpcException({
        status: 'error',
        message: error instanceof Error ? error.message : 'Login failed',
      });
    }
  }

  @MessagePattern('validate-token')
  async validateToken(
    @RpcPayload() token: string,
  ): Promise<ValidateTokenResponse> {
    try {
      return await this.appService.validateToken(token);
    } catch (error) {
      this.logger.error('Token validation error:', error);
      throw new RpcException({
        status: 'error',
        message: error instanceof Error ? error.message : 'Validation failed',
      });
    }
  }
}
