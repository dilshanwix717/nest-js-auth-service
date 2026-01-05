// libs/common/src/constants/rabbitmq.constants.ts
// ===================================================

/**
 * RabbitMQ Service Names
 * Used for ClientProxy injection tokens
 */
export const SERVICES = {
  AUTH: 'AUTH-SERVICE',
  USER: 'USER-SERVICE',
} as const;

/**
 * RabbitMQ Queue Names
 * Each microservice has its own queue for message consumption
 */
export const QUEUES = {
  AUTH_QUEUE: 'auth_queue',
  USER_QUEUE: 'user_queue',
} as const;

/**
 * RabbitMQ Message Patterns
 * Defines the routing keys for different operations
 */
export const MESSAGE_PATTERNS = {
  // Auth Service Patterns
  AUTH_SIGNUP: 'auth.signup',
  AUTH_LOGIN: 'auth.login',
  AUTH_VALIDATE_TOKEN: 'auth.validate-token',

  // User Service Patterns
  USER_CREATE: 'user.create',
  USER_FIND_BY_ID: 'user.find-by-id',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
} as const;

/**
 * RabbitMQ Connection Configuration
 */
export interface RabbitMQConfig {
  urls: string[];
  queue: string;
  queueOptions?: {
    durable: boolean;
    noAck?: boolean;
    prefetchCount?: number;
  };
}

/**
 * Default RabbitMQ Configuration
 */
export const DEFAULT_RABBITMQ_CONFIG = {
  urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
  queueOptions: {
    durable: true,
    noAck: false,
    prefetchCount: 1,
  },
} as const;
