// apps/auth-service/src/auth/auth.service.ts
// ============================================

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthLoginRequestDto } from '../libs/dto/auth-login.dto';
import type { AuthLoginResponseDto } from '../libs/dto/auth-login-response.dto';
import type { AuthSignUpRequestDto } from '../libs/dto/auth-signup.dto';
import type { AuthSignUpResponseDto } from '../libs/dto/auth-signup-response.dto';
import type { ValidateTokenResponseDto } from '../libs/dto/validate-token-response.dto';
import type { JwtPayload } from '../libs/dto/jwt-payload.dto';

/**
 * User data interface from database
 */
interface UserData {
  id: string;
  username: string;
  email: string;
  password: string;
  roles: string[];
}

/**
 * Auth Service - Handles authentication business logic
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Creates a new user in the database with hashed password
   */
  async createUser(
    username: string,
    email: string,
    password: string,
    roles: string[] = ['user'],
  ): Promise<UserData> {
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    return (await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        roles,
      },
    })) as UserData;
  }

  /**
   * Finds a user by username
   */
  async findUserByUsername(username: string): Promise<UserData | null> {
    return this.prisma.user.findUnique({
      where: { username },
    }) as Promise<UserData | null>;
  }

  /**
   * Finds a user by ID
   */
  async findUserById(id: string): Promise<UserData | null> {
    return this.prisma.user.findUnique({
      where: { id },
    }) as Promise<UserData | null>;
  }

  /**
   * Handles user signup
   */
  async signUp(dto: AuthSignUpRequestDto): Promise<AuthSignUpResponseDto> {
    this.logger.log('Processing signup request', {
      username: dto.username,
      email: dto.email,
    });

    const { username, email, password, roles } = dto;

    if (!email || !username || !password) {
      throw new Error('Missing required fields: email, username, password');
    }

    // Check for existing user
    const existingUser = (await this.prisma.user.findFirst({
      where: { email },
    })) as UserData | null;

    if (existingUser) {
      this.logger.warn(`Signup failed: email already in use - ${email}`);
      throw new Error('Email already in use');
    }

    // Create new user
    const user = await this.createUser(username, email, password, roles);

    this.logger.log(`User created successfully: ${user.id}`);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
    };
  }

  /**
   * Handles user login
   */
  async login(credential: AuthLoginRequestDto): Promise<AuthLoginResponseDto> {
    const { email, password } = credential;

    // Fetch user
    const user = (await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        password: true,
        email: true,
        roles: true,
      },
    })) as UserData | null;

    if (!user) {
      this.logger.warn(`Login failed: user not found - ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Login failed: invalid password - ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload: JwtPayload = { userId: user.id, roles: user.roles };
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

  /**
   * Validates a JWT token
   */
  async validateToken(token: string): Promise<ValidateTokenResponseDto> {
    try {
      const decoded = this.jwtService.verify<JwtPayload>(token);

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, email: true, roles: true },
      });

      if (!user) {
        this.logger.warn(
          `Token validation failed: user not found - ${decoded.userId}`,
        );
        return { valid: false, user: null };
      }

      return {
        valid: true,
        user: {
          userId: user.id,
          roles: user.roles,
        },
      };
    } catch (error) {
      this.logger.error(
        'Token validation error:',
        error instanceof Error ? error.message : 'Unknown',
      );
      return { valid: false, user: null };
    }
  }
}
