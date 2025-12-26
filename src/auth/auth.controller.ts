// FILE: apps/auth-service/src/auth/auth.controller.ts

import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { RpcPayload } from '../common/decorators/rpc-payload.decorator';
import type { AuthLoginRequestDto } from '../libs/dto/auth-login.dto';
import type { AuthLoginResponseDto } from '../libs/dto/auth-login-response.dto';
import type { ValidateTokenResponse } from '../libs/dto/validate-token.dto';
import type { AuthSignUpRequestDto } from '../libs/dto/auth-signup.dto';
import type { AuthSignUpResponseDto } from '../libs/dto/auth-signup-response.dto';

/**
 * @Controller() - Marks as NestJS controller for message handling
 */
@Controller()
export class AuthController {
  // Logger for tracking request/response flow
  private readonly logger = new Logger(AuthController.name);

  /**
   * Constructor - Dependency Injection
   * @param authService - Injected AuthService for business logic
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * @MessagePattern('auth-signup') - Listens for signup RPC messages
   * Handles user registration requests
   */
  @MessagePattern('auth-signup')
  async signUp(
    @RpcPayload() dto: AuthSignUpRequestDto,
  ): Promise<AuthSignUpResponseDto> {
    // Log incoming request with user-identifying details
    this.logger.log('Received auth-signup message:', {
      username: dto.username,
      email: dto.email,
      roles: dto.roles,
    });

    try {
      // Delegate to service for actual signup logic
      const result = await this.authService.signUp(dto);
      this.logger.log('Signup successful:', result);
      return result;
    } catch (error) {
      // Log and re-throw as RpcException for client-friendly error response
      this.logger.error('Signup error:', error);
      throw new RpcException({
        status: 'error',
        message: error instanceof Error ? error.message : 'Signup failed',
      });
    }
  }

  /**
   * @MessagePattern('auth-login') - Listens for login RPC messages
   * Handles user authentication and JWT token generation
   */
  @MessagePattern('auth-login')
  async login(
    @RpcPayload() credential: AuthLoginRequestDto,
  ): Promise<AuthLoginResponseDto> {
    this.logger.log('Received auth-login message:', credential.email);

    try {
      // Delegate to service for authentication and token generation
      return await this.authService.login(credential);
    } catch (error) {
      this.logger.error('Login error:', error);
      throw new RpcException({
        status: 'error',
        message: error instanceof Error ? error.message : 'Login failed',
      });
    }
  }

  /**
   * @MessagePattern('validate-token') - Listens for token validation RPC messages
   * Handles JWT token verification and user validation
   */
  @MessagePattern('validate-token')
  async validateToken(
    @RpcPayload() token: string,
  ): Promise<ValidateTokenResponse> {
    try {
      // Delegate to service for token verification
      return await this.authService.validateToken(token);
    } catch (error) {
      this.logger.error('Token validation error:', error);
      throw new RpcException({
        status: 'error',
        message: error instanceof Error ? error.message : 'Validation failed',
      });
    }
  }
}
