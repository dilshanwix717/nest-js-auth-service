/**
 * PrismaService
 * --------------
 * Centralized Prisma ORM service for NestJS.
 *
 * Responsibilities:
 * - Manage database connections
 * - Provide Prisma Client across the application
 * - Handle lifecycle hooks for clean startup & shutdown
 */
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Extends PrismaClient
 * --------------------
 * This allows PrismaService to directly use Prisma methods like:
 * - this.user.findMany()
 * - this.$transaction()
 *
 * Implements OnModuleInit - Runs logic when NestJS finishes initializing the module.
 * Implements OnModuleDestroy - Runs cleanup logic when NestJS shuts down the application.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Logger instance scoped to this service
   * Example log output: [PrismaService] Database connected successfully
   */
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Constructor - Initializes the PostgreSQL connection pool
   * and passes it to Prisma using the PrismaPg adapter.
   */
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('Missing required environment variable: DATABASE_URL');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const pool = new Pool({
      connectionString: databaseUrl,
    });

    super({
      adapter: new PrismaPg(pool),
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  /**
   * onModuleInit() - Automatically called by NestJS when the module is initialized.
   * Purpose:
   * - Establish database connection
   * - Fail early if the database is unreachable
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('✅ Database connected successfully');
  }

  /**
   * onModuleDestroy() - Automatically called by NestJS during app shutdown.
   * Purpose:
   * - Gracefully close database connections
   * - Prevent open handles and memory leaks
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
