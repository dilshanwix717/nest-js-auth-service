// FILE: apps/auth-service/src/main.ts

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

/**
 * Bootstrap function - Initializes and starts the microservice
 */
async function bootstrap() {
  /**
   * Create NestJS microservice instance
   *
   * createMicroservice vs createNestApplication:
   * - createMicroservice: For inter-service RPC communication (TCP, RabbitMQ, etc.)
   * - createNestApplication: For HTTP REST APIs
   */
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      /**
       * Transport.TCP - Use TCP protocol for inter-service communication
       *
       * Other transports available:
       * - RabbitMQ: Message broker (high-performance)
       * - MQTT: IoT messaging protocol
       * - gRPC: High-performance RPC framework
       * - Kafka: Stream processing
       */
      transport: Transport.TCP,
      options: {
        // Read host/port from environment or use defaults
        host: process.env.AUTH_SERVICE_HOST || '127.0.0.1',
        port: parseInt(process.env.AUTH_SERVICE_PORT || '8877', 10),
      },
    },
  );

  /**
   * useGlobalPipes - Attach global validation and transformation middleware
   *
   * ValidationPipe provides:
   * - whitelist: true - Remove properties not defined in DTO
   * - forbidNonWhitelisted: false - Don't throw on extra properties (just remove them)
   * - transform: true - Auto-convert primitive types (string '123' -> number 123)
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Start listening for TCP connections
  await app.listen();
  Logger.log(`🚀 Auth Service is running on TCP port 8877`);
}

// Execute bootstrap function to start the application
bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  // Ensure non-zero exit code so supervisors detect failure
  process.exit(1);
});
