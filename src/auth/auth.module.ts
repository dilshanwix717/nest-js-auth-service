// FILE: apps/auth-service/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
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
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
