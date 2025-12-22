// FILE: apps/auth-service/src/app.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from './prisma/prisma.service.ts';
import type { AuthLoginRequestDto } from '@/lib/dto/auth-login.dto';
import type { AuthLoginResponseDto } from '@/lib/dto/auth-login-response.dto';
import type { ValidateTokenResponse } from '@/lib/dto/validate-token.dto';
import type { JwtPayload } from '@/lib/auth/jwt-payload';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(credential: AuthLoginRequestDto): Promise<AuthLoginResponseDto> {
    const { username, password } = credential;

    // Find user by username
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        email: true,
        roles: true,
      },
    });

    if (!user) {
      this.logger.warn(`Login attempt failed: user not found - ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Login attempt failed: invalid password - ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create JWT payload
    const payload: JwtPayload = {
      userId: user.id,
      roles: user.roles,
    };

    const token = this.jwtService.sign(payload);

    this.logger.log(`User logged in successfully: ${username}`);

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

      // Optional: Check if user still exists in database
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          email: true,
          roles: true,
        },
      });

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
      this.logger.error('Token validation error', (err as Error).message);
      return {
        valid: false,
        user: null,
      };
    }
  }
}
