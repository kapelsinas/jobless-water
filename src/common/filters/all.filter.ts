import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

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

        let message = 'Internal server error';
        const details = (exception as any)?.details;

        if (exception instanceof HttpException) {
            const res = exception.getResponse();
            message = typeof res === 'object' ? (res as any).message || res : res;

            if (Array.isArray(message)) message = message.join(', ');
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
