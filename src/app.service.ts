// FILE: apps/auth-service/src/app.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from './prisma/prisma.service';
import type { AuthLoginRequestDto } from './libs/dto/auth-login.dto.js';
import type { AuthLoginResponseDto } from './libs/dto/auth-login-response.dto';
import type { ValidateTokenResponse } from './libs/dto/validate-token.dto';
import type { JwtPayload } from './libs/dto/jwt-payload.dto';
import { AuthUser } from './common/interfaces/auth-user.interface';
import { ValidateTokenUser } from './common/interfaces/validate-token-user.interface';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(credential: AuthLoginRequestDto): Promise<AuthLoginResponseDto> {
    const { email, password } = credential;

    // Find user by email - let Prisma infer the type, use satisfies for validation
    const user = (await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        password: true,
        email: true,
        roles: true,
      },
    })) as AuthUser | null;

    if (!user) {
      this.logger.warn(`Login attempt failed: user not found - ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Login attempt failed: invalid password - ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create JWT payload
    const payload: JwtPayload = {
      userId: user.id,
      roles: user.roles,
    };

    const token = this.jwtService.sign(payload);

    this.logger.log(`User logged in successfully: ${email}`);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  async validateToken(token: string): Promise<ValidateTokenResponse> {
    try {
      const decoded = this.jwtService.verify<JwtPayload>(token);

      // Check if user still exists in database
      const user = (await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          email: true,
          roles: true,
        },
      })) as ValidateTokenUser | null;

      if (!user) {
        this.logger.warn(
          `Token validation failed: user not found - ${decoded.userId}`,
        );
        return {
          valid: false,
          user: null,
        };
      }

      return {
        valid: true,
        user: {
          userId: user.id,
          roles: user.roles,
        },
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error('Token validation error', errorMessage);
      return {
        valid: false,
        user: null,
      };
    }
  }
}
