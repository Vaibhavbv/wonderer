import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'Internal server error';

    const errorCode =
      typeof exceptionResponse === 'object' && (exceptionResponse as any).error
        ? (exceptionResponse as any).error
        : HttpStatus[status] || 'UNKNOWN_ERROR';

    const details =
      typeof exceptionResponse === 'object' && (exceptionResponse as any).message
        ? Array.isArray((exceptionResponse as any).message)
          ? (exceptionResponse as any).message.map((msg: string) => {
              const match = msg.match(/^([\w.]+)\s+(.+)$/);
              return match
                ? { field: match[1], message: match[2] }
                : { field: 'general', message: msg };
            })
          : [{ field: 'general', message: (exceptionResponse as any).message }]
        : undefined;

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      data: null,
      error: {
        code: this.snakeCase(errorCode),
        message: Array.isArray(message) ? message[0] : message,
        details: details || undefined,
      },
      meta: null,
    });
  }

  private snakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .replace(/^_/, '')
      .toUpperCase();
  }
}
