import { HttpException, HttpStatus } from '@nestjs/common';

export type ErrorDetails = {
  message: string;
  status: HttpStatus;
  details?: unknown;
  code?: string;
};

export class AppException extends HttpException {
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(error: ErrorDetails) {
    super(
      {
        message: error.message,
        code: error.code,
        details: error.details,
      },
      error.status,
    );
    this.code = error.code;
    this.details = error.details;
  }
}
