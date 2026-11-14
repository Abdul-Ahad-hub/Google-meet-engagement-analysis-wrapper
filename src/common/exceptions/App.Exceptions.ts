import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    public readonly errorCode: string,
    message: string,
    status: HttpStatus,
    public readonly details?: Record<string, unknown>,
  ) {
    super(
      {
        statusCode: status,
        errorCode,
        message,
        ...(details ? { details } : {}),
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}
