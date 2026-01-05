// apps/auth-service/src/main.ts
// ================================

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { QUEUES } from 'libs/common/src/constants/rabbitmq.constants';
import { RpcExceptionFilter } from './common/filters/rpc-exception.filter';
/**
 * Bootstrap function - Initializes and starts the Auth microservice with RabbitMQ
 */
async function bootstrap() {
  const logger = new Logger('AuthServiceBootstrap');

  try {
    // RabbitMQ connection URL from environment or default
    const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

    logger.log(`Connecting to RabbitMQ at: ${rabbitMQUrl}`);

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      AppModule,
      {
        transport: Transport.RMQ,
        options: {
          urls: [rabbitMQUrl],
          queue: QUEUES.AUTH_QUEUE,
          queueOptions: {
            durable: true, // Queue survives broker restart
          },
          // Prefetch count - number of messages to process concurrently
          prefetchCount: 1,
          // Disable automatic acknowledgment for better reliability
          noAck: false,
          // Connection heartbeat to detect dropped connections
          heartbeat: 60,
        },
      },
    );

    // Global validation pipe for DTO validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Global exception filter for RPC errors
    app.useGlobalFilters(new RpcExceptionFilter());

    // Start listening for RabbitMQ messages
    await app.listen();

    logger.log(
      `🚀 Auth Service is running with RabbitMQ queue: ${QUEUES.AUTH_QUEUE}`,
    );
  } catch (error) {
    logger.error('Fatal error during bootstrap:', error);
    process.exit(1);
  }
}

bootstrap();
