// FILE: apps/auth-service/src/main.ts
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.AUTH_SERVICE_HOST || '127.0.0.1',
        port: parseInt(process.env.AUTH_SERVICE_PORT || '8877', 10),
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  await app.listen();
  Logger.log(`🚀 Auth Service is running on TCP port 8877`);
}

bootstrap();
