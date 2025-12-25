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

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const pattern = context.switchToRpc().getContext();
    const data = context.switchToRpc().getData();

    console.log(`📨 Request received: ${JSON.stringify(pattern)}`);
    console.log(`📦 Payload:`, data);

    return next.handle().pipe(
      tap((result) => {
        console.log(`✅ Response sent:`, result);
      }),
      catchError((error) => {
        console.error(`❌ Error in handler:`, error);
        console.error(`   Stack:`, error?.stack);
        return throwError(() => error);
      }),
    );
  }
}
