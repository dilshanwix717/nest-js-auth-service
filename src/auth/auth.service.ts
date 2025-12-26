// FILE: apps/auth-service/src/auth/auth.service.ts

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserData } from '../common/interfaces/auth-user.interface';
import type { AuthLoginRequestDto } from '../libs/dto/auth-login.dto';
import type { AuthLoginResponseDto } from '../libs/dto/auth-login-response.dto';
import type { AuthSignUpRequestDto } from '../libs/dto/auth-signup.dto';
import type { AuthSignUpResponseDto } from '../libs/dto/auth-signup-response.dto';
import type { ValidateTokenResponse } from '../libs/dto/validate-token.dto';
import type { JwtPayload } from '../libs/dto/jwt-payload.dto';
import { ValidateTokenUser } from '../common/interfaces/validate-token-user.interface';

/**
 * @Injectable() - Marks this class as a NestJS service that can be injected as a dependency
 * Services are singleton instances managed by the NestJS dependency injection container
 */
@Injectable()
export class AuthService {
  // Logger instance for logging messages and errors with the service name
  private readonly logger = new Logger(AuthService.name);

  // Bcrypt salt rounds - higher value = more secure but slower (10 is industry standard)
  private readonly SALT_ROUNDS = 10;

  /**
   * Constructor - Dependency Injection
   *
   * prisma - PrismaService instance for database operations
   * jwtService - JwtService instance for JWT token operations
   * Note: Dependencies are injected by NestJS and marked as readonly for immutability
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Creates a new user in the database with hashed password
   *  Promise<UserData> - Created user object
   * Security: Password is hashed using bcrypt before storing in database
   */
  async createUser(
    username: string,
    email: string,
    password: string,
    roles: string[] = ['user'],
  ): Promise<UserData> {
    // Hash the password using bcrypt with configured salt rounds
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user record in database with hashed password
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
   * Finds a user by their username
   *  username - The username to search for
   * returns Promise<UserData | null> - User object if found, null otherwise
   */
  findUserByUsername(username: string): Promise<UserData | null> {
    // Use Prisma's findUnique for efficient indexed lookup
    return this.prisma.user.findUnique({
      where: { username },
    }) as Promise<UserData | null>;
  }

  /**
   * Finds a user by their ID
   *
   *  id - The user's unique identifier (UUID)
   * returns Promise<UserData | null> - User object if found, null otherwise
   */
  findUserById(id: string): Promise<UserData | null> {
    // Use Prisma's findUnique for primary key lookup
    return this.prisma.user.findUnique({
      where: { id },
    }) as Promise<UserData | null>;
  }

  /**
   * User registration (signup) handler
   *
   * Validates input, checks for existing users, creates new user account
   *
   *  dto - AuthSignUpRequestDto containing username, email, password, roles
   * returns Promise<AuthSignUpResponseDto> - Created user data (without password)
   * throws Error if email exists, required fields missing, or database error occurs
   */
  async signUp(dto: AuthSignUpRequestDto): Promise<AuthSignUpResponseDto> {
    this.logger.log('SignUp DTO received:', JSON.stringify(dto));

    // Destructure the request DTO for easier access
    const { username, email, password, roles } = dto;

    this.logger.log('Destructured values:', {
      username,
      email,
      password,
      roles,
    });

    // Validate that all required fields are provided
    if (!email || !username || !password) {
      this.logger.error('Missing required fields:', {
        email,
        username,
        password,
      });
      throw new Error('Missing required fields: email, username, password');
    }

    try {
      // Check if user with this email already exists (prevent duplicates)
      const existingUser = (await this.prisma.user.findFirst({
        where: { email },
      })) as UserData | null;

      if (existingUser) {
        this.logger.warn(`Email already in use: ${email}`);
        throw new Error('Email already in use');
      }

      this.logger.log('Creating user via AuthService...');

      // Create the new user with hashed password
      const user = await this.createUser(username, email, password, roles);

      this.logger.log('User created successfully:', user.id);

      // Return user data (excluding password for security)
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
      };
    } catch (error) {
      // Log comprehensive error details for debugging
      this.logger.error('SignUp error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * User login handler
   * Authenticates user by verifying email and password, generates JWT token
   *
   * credential - AuthLoginRequestDto containing email and password
   * returns Promise<AuthLoginResponseDto> - JWT token and user data
   * throws UnauthorizedException if user not found or password invalid
   */
  async login(credential: AuthLoginRequestDto): Promise<AuthLoginResponseDto> {
    const { email, password } = credential;

    // Fetch user from database with only necessary fields
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

    // Check if user exists with this email
    if (!user) {
      this.logger.warn(`Login attempt failed: user not found - ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password using bcrypt (compares provided password with hashed password)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Login attempt failed: invalid password - ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create JWT payload with user identity information
    const payload: JwtPayload = { userId: user.id, roles: user.roles };

    // Sign and generate JWT token (expires based on JWT_EXPIRES_IN config)
    const token = this.jwtService.sign(payload);

    this.logger.log(`User logged in successfully: ${email}`);

    // Return token and user data (excluding password)
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
   * JWT token validation handler
   *
   * Verifies token signature and checks if user still exists in database
   * token - JWT token string to validate
   * returns Promise<ValidateTokenResponse> - Validation result with user data if valid
   *
   * Note: Does not throw errors; returns {valid: false} for any validation failure
   */
  async validateToken(token: string): Promise<ValidateTokenResponse> {
    try {
      // Verify JWT token signature and expiration
      // Returns decoded payload if valid, throws error if invalid/expired
      const decoded = this.jwtService.verify<JwtPayload>(token);

      // Fetch user from database to ensure they still exist
      const user = (await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, email: true, roles: true },
      })) as ValidateTokenUser | null;

      // Check if user exists (they may have been deleted after token was issued)
      if (!user) {
        this.logger.warn(
          `Token validation failed: user not found - ${decoded.userId}`,
        );
        return { valid: false, user: null };
      }

      // Token is valid and user exists
      return { valid: true, user: { userId: user.id, roles: user.roles } };
    } catch (err) {
      // Catch token verification errors (expired, invalid signature, etc.)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error('Token validation error', errorMessage);
      return { valid: false, user: null };
    }
  }
}
