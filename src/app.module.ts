// FILE: apps/auth-service/src/app.module.ts
/**
 * AppModule - Root module of the application
 *
 * Responsible for:
 * - Loading environment variables
 * - Configuring JWT for authentication
 * - Initializing database module (Prisma)
 * - Registering auth-related modules
 * - Setting up global interceptors for logging
 *
 * Architecture:
 * AppModule (root)
 *   ├── ConfigModule: Environment variables
 *   ├── JwtModule: JWT token generation/verification
 *   ├── PrismaModule: Database ORM service
 *   ├── AuthModule: Authentication logic, controller, service
 *   └── LoggingInterceptor: Request/response logging
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { LoggingInterceptor } from './common/logging.interceptor';

/**
 * @Module() - Defines module metadata for NestJS
 *
 * Properties:
 * - imports: External modules this module depends on
 * - controllers: HTTP controllers (empty for microservice)
 * - providers: Services, factories, custom providers
 */
@Module({
  imports: [
    /**
     * ConfigModule.forRoot - Load environment variables
     *
     * Options:
     * - isGlobal: true - Make config available across all modules
     * - envFilePath: '.env' - Load from .env file
     */
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    /**
     * JwtModule.registerAsync - Configure JWT with dynamic values from ConfigService
     *
     * registerAsync allows dependency injection (ConfigService) unlike register()
     *
     * Configuration:
     * - secret: JWT signing key (from JWT_SECRET env var)
     * - signOptions.expiresIn: Token expiration time (from JWT_EXPIRES_IN env var)
     *
     * This config is injected into AuthService for token generation
     */
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // Secret key for signing tokens - MUST be strong in production
        secret: config.get<string>('JWT_SECRET') ?? 'your_jwt_secret_change_me',
        signOptions: {
          // Expiration time (e.g., '1h', '7d', '30d')
          expiresIn: config.get<StringValue>('JWT_EXPIRES_IN') ?? '1h',
        },
      }),
    }),

    // Prisma ORM service for database operations
    PrismaModule,

    // Auth module containing controller, service, and auth logic
    AuthModule,
  ],

  // Empty for microservice (uses message patterns instead of HTTP routes)
  controllers: [],

  // Global providers available to all modules
  providers: [
    /**
     * APP_INTERCEPTOR - Global interceptor for all requests
     *
     * LoggingInterceptor logs:
     * - Incoming RPC message patterns and payloads
     * - Outgoing responses
     * - Errors and exceptions
     */
    {
      provide: 'APP_INTERCEPTOR',
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
