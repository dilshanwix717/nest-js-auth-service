// src/common/logging.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * @Injectable() - Marks as NestJS provider for dependency injection
 * Implements NestInterceptor - All microservice interceptors must implement this interface
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  /**
   * intercept() - Intercepts request before handler and response after handler
   *
   *  context - Execution context containing request metadata
   *  next - Handler that processes the request
   *  returns Observable<any> - Observable stream of the response
   *
   * Flow:
   * 1. Extract RPC context (message pattern) and payload (data)
   * 2. Log incoming request
   * 3. Pass to next handler (service)
   * 4. Log response or error
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Extract RPC message context (e.g., 'auth-signup') with explicit typing
    const pattern = context.switchToRpc().getContext<unknown>();

    // Extract request payload/data sent by client with explicit typing
    const data = context.switchToRpc().getData<unknown>();

    // Log incoming RPC request
    console.log(`📨 Request received: ${JSON.stringify(pattern)}`);
    console.log(`📦 Payload:`, data);

    /**
     * next.handle() - Calls the actual message handler
     * Returns Observable that emits handler result
     *
     * Reactive Pipeline (RxJS operators):
     * - tap(): Side effect operator - logs response without modifying it
     * - catchError(): Error handling operator - logs errors and re-throws
     */
    return next.handle().pipe(
      /**
       * tap() - Executes function for each emitted value without modifying it
       */
      tap((result) => {
        console.log(`✅ Response sent:`, result);
      }),
      /**
       * This ensures error propagates to client after logging
       */
      catchError((err: unknown) => {
        if (err instanceof Error) {
          console.error(`❌ Error in handler:`, err.message);
          console.error(`   Stack:`, err.stack);
        } else {
          console.error(`❌ Error in handler:`, err);
        }
        // Re-throw error after logging so client receives it
        return throwError(() => err);
      }),
    );
  }
}
