// apps/auth-service/src/auth/auth.controller.ts
// ================================================

import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import type { AuthLoginRequestDto } from '../libs/dto/auth-login.dto';
import type { AuthLoginResponseDto } from '../libs/dto/auth-login-response.dto';
import type { AuthSignUpRequestDto } from '../libs/dto/auth-signup.dto';
import type { AuthSignUpResponseDto } from '../libs/dto/auth-signup-response.dto';
import { MESSAGE_PATTERNS } from 'libs/common/src/constants/rabbitmq.constants';
import { ValidateTokenRequestDto } from 'src/libs/dto/validate-token-request.dto';
import { ValidateTokenResponseDto } from 'src/libs/dto/validate-token-response.dto';

/**
 * Auth Controller - Handles RabbitMQ message patterns for authentication
 */
@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Handles user signup requests
   * Pattern: auth.signup
   */
  @MessagePattern(MESSAGE_PATTERNS.AUTH_SIGNUP)
  async signUp(
    @Payload() dto: AuthSignUpRequestDto,
  ): Promise<AuthSignUpResponseDto> {
    this.logger.log(`Received ${MESSAGE_PATTERNS.AUTH_SIGNUP} message`, {
      username: dto.username,
      email: dto.email,
    });

    try {
      const result = await this.authService.signUp(dto);

      this.logger.log(`Signup successful for user: ${result.id}`);

      return result;
    } catch (error) {
      this.logger.error('Signup error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        dto: { username: dto.username, email: dto.email },
      });

      throw new RpcException({
        statusCode:
          error instanceof Error && (error as any).statusCode
            ? (error as any).statusCode
            : 400,
        message: error instanceof Error ? error.message : 'Signup failed',
        error: 'SignupError',
      });
    }
  }

  /**
   * Handles user login requests
   * Pattern: auth.login
   */
  @MessagePattern(MESSAGE_PATTERNS.AUTH_LOGIN)
  async login(
    @Payload() credential: AuthLoginRequestDto,
  ): Promise<AuthLoginResponseDto> {
    this.logger.log(`Received ${MESSAGE_PATTERNS.AUTH_LOGIN} message`, {
      email: credential.email,
    });

    try {
      const result = await this.authService.login(credential);

      this.logger.log(`Login successful for user: ${credential.email}`);

      return result;
    } catch (error) {
      this.logger.error('Login error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        email: credential.email,
      });

      throw new RpcException({
        statusCode:
          error instanceof Error && (error as any).statusCode
            ? (error as any).statusCode
            : 401,
        message: error instanceof Error ? error.message : 'Login failed',
        error: 'LoginError',
      });
    }
  }

  /**
   * Handles token validation requests
   * Pattern: auth.validate-token
   */
  @MessagePattern(MESSAGE_PATTERNS.AUTH_VALIDATE_TOKEN)
  async validateToken(
    @Payload() dto: ValidateTokenRequestDto,
  ): Promise<ValidateTokenResponseDto> {
    this.logger.log(`Received ${MESSAGE_PATTERNS.AUTH_VALIDATE_TOKEN} message`);

    try {
      const result = await this.authService.validateToken(dto.token);

      this.logger.log(`Token validation result: ${result.valid}`);

      return result;
    } catch (error) {
      this.logger.error('Token validation error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new RpcException({
        statusCode: 401,
        message:
          error instanceof Error ? error.message : 'Token validation failed',
        error: 'TokenValidationError',
      });
    }
  }
}
