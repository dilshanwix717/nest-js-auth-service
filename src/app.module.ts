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
