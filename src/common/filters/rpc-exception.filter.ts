// apps/auth-service/src/common/filters/rpc-exception.filter.ts
// ==============================================================

import {
  Catch,
  RpcExceptionFilter as NestRpcExceptionFilter,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

/**
 * Global RPC Exception Filter
 * Catches and formats exceptions from microservice message handlers
 */
@Catch()
export class RpcExceptionFilter implements NestRpcExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost): Observable<never> {
    this.logger.error('RPC Exception caught:', {
      message: exception.message,
      stack: exception.stack,
      name: exception.name,
    });

    // Format error for consistent response structure
    const error = this.formatError(exception);

    return throwError(() => error);
  }

  /**
   * Formats different error types into a consistent structure
   */
  private formatError(exception: Error): RpcException {
    // If already an RpcException, return as-is
    if (exception instanceof RpcException) {
      return exception;
    }

    // Extract status code from known error types
    const statusCode = this.extractStatusCode(exception);

    // Create standardized error response
    const errorResponse = {
      statusCode,
      message: exception.message || 'Internal server error',
      error: exception.name || 'Error',
      timestamp: new Date().toISOString(),
    };

    return new RpcException(errorResponse);
  }

  /**
   * Extracts HTTP-like status code from various error types
   */
  private extractStatusCode(exception: Error): number {
    const exceptionAny = exception as any;

    // Check for status or statusCode property
    if (exceptionAny.status) return Number(exceptionAny.status);
    if (exceptionAny.statusCode) return Number(exceptionAny.statusCode);

    // Map common error names to status codes
    const errorNameToStatusMap: Record<string, number> = {
      UnauthorizedException: 401,
      ForbiddenException: 403,
      NotFoundException: 404,
      BadRequestException: 400,
      ConflictException: 409,
      InternalServerErrorException: 500,
    };

    return errorNameToStatusMap[exception.name] || 500;
  }
}
