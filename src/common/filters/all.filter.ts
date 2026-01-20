import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ExceptionWithDetails {
  details?: unknown;
}

interface HttpExceptionResponse {
  message?: string | string[];
}

function hasDetails(exception: unknown): exception is ExceptionWithDetails {
  return (
    typeof exception === 'object' &&
    exception !== null &&
    'details' in exception
  );
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string = 'Internal server error';
    const details = hasDetails(exception) ? exception.details : undefined;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const httpRes = res as HttpExceptionResponse;
        const resMessage = httpRes.message;
        if (Array.isArray(resMessage)) {
          message = resMessage.join(', ');
        } else if (typeof resMessage === 'string') {
          message = resMessage;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled Error: ${message}`, exception.stack);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      code: status,
      details,
    });
  }
}
