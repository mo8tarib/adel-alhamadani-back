import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, catchError, finalize, throwError } from 'rxjs';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();
    let errorMessage: string | undefined;
    let errorStatus: number | undefined;

    return next.handle().pipe(
      catchError((error: unknown) => {
        errorMessage = error instanceof Error ? error.message : String(error);
        errorStatus = error instanceof HttpException ? error.getStatus() : 500;
        return throwError(() => error);
      }),
      finalize(() => {
        const status = errorStatus ?? response.statusCode;
        const message = `${request.method} ${request.originalUrl} ${status} ${Date.now() - startedAt}ms`;

        if (errorMessage || status >= 500) {
          this.logger.error(
            `${message}${errorMessage ? ` - ${errorMessage}` : ''}`,
          );
        } else if (status >= 400) {
          this.logger.warn(message);
        } else {
          this.logger.log(message);
        }
      }),
    );
  }
}
