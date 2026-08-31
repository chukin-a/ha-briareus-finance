import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const requestId = request.header('x-request-id') || randomUUID();
    const statusCode = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const technicalMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`${request.method} ${request.originalUrl} failed [${requestId}]: ${technicalMessage}`);
    }
    const payload = error instanceof HttpException ? error.getResponse() : null;
    const objectPayload = typeof payload === 'object' && payload !== null ? payload as Record<string, unknown> : null;
    const rawMessage = objectPayload?.message ?? payload;
    const message = Array.isArray(rawMessage) ? rawMessage.join('; ') : typeof rawMessage === 'string' ? rawMessage : statusCode === 500 ? 'Internal server error' : error instanceof Error ? error.message : 'Request failed';
    response.status(statusCode).json({
      statusCode,
      code: typeof objectPayload?.code === 'string' ? objectPayload.code : this.defaultCode(statusCode),
      message,
      details: objectPayload?.details ?? null,
      requestId,
      path: request.originalUrl,
    });
  }

  private defaultCode(status: number) {
    if (status === 400) return 'VALIDATION_ERROR';
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 409) return 'CONFLICT';
    return 'INTERNAL_ERROR';
  }
}
