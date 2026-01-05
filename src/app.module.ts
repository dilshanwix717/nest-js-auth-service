// FILE: apps/auth-service/src/app.module.ts

import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { LoggingInterceptor } from './common/logging.interceptor';

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
    {
      provide: 'APP_INTERCEPTOR',
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
