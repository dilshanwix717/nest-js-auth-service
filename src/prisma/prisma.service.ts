// FILE: apps/auth-service/src/prisma/prisma.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      // Can't use `this.logger` before `super()` in derived constructor
      console.error('DATABASE_URL environment variable is not defined');
      throw new Error('Missing required environment variable: DATABASE_URL');
    }

    // Explicitly type the Pool to avoid unsafe `any` inference
    // If your environment lacks `pg` types, adjust tsconfig or install `@types/pg`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const pool: Pool = new Pool({
      connectionString: databaseUrl,
    });

    super({
      adapter: new PrismaPg(pool),
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
