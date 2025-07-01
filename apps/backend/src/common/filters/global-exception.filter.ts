import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  method: string;
  correlationId?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);
    
    // Log error details (with sensitive info) for debugging
    this.logError(exception, request, errorResponse);

    // Send sanitized error response to client
    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, request: Request): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;
    const correlationId = this.generateCorrelationId();

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, { timestamp, path, method, correlationId });
    }

    // Handle database errors
    if (this.isDatabaseError(exception)) {
      return this.handleDatabaseError(exception, { timestamp, path, method, correlationId });
    }

    // Handle validation errors
    if (this.isValidationError(exception)) {
      return this.handleValidationError(exception, { timestamp, path, method, correlationId });
    }

    // Handle unknown errors
    return this.handleUnknownError(exception, { timestamp, path, method, correlationId });
  }

  private handleHttpException(
    exception: HttpException,
    context: { timestamp: string; path: string; method: string; correlationId: string }
  ): ErrorResponse {
    const status = exception.getStatus();
    const response = exception.getResponse();

    let message: string | string[];
    let error: string;

    if (typeof response === 'object' && response !== null) {
      const responseObj = response as any;
      message = responseObj.message || exception.message;
      error = responseObj.error || exception.name;
    } else {
      message = response as string;
      error = exception.name;
    }

    // Sanitize error messages for production
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      message = 'An internal server error occurred. Please contact support if the issue persists.';
      error = 'Internal Server Error';
    }

    return {
      statusCode: status,
      message: this.sanitizeMessage(message),
      error,
      timestamp: context.timestamp,
      path: context.path,
      method: context.method,
      correlationId: context.correlationId,
    };
  }

  private handleDatabaseError(
    exception: any,
    context: { timestamp: string; path: string; method: string; correlationId: string }
  ): ErrorResponse {
    // Common database error patterns
    if (exception.code === '23505' || exception.message?.includes('UNIQUE constraint')) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'A record with this information already exists.',
        error: 'Duplicate Entry',
        timestamp: context.timestamp,
        path: context.path,
        method: context.method,
        correlationId: context.correlationId,
      };
    }

    if (exception.code === '23503' || exception.message?.includes('FOREIGN KEY constraint')) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Cannot perform this operation due to related data constraints.',
        error: 'Constraint Violation',
        timestamp: context.timestamp,
        path: context.path,
        method: context.method,
        correlationId: context.correlationId,
      };
    }

    // Generic database error
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'A database error occurred. Please try again later.',
      error: 'Database Error',
      timestamp: context.timestamp,
      path: context.path,
      method: context.method,
      correlationId: context.correlationId,
    };
  }

  private handleValidationError(
    exception: any,
    context: { timestamp: string; path: string; method: string; correlationId: string }
  ): ErrorResponse {
    const message = Array.isArray(exception.message) 
      ? exception.message 
      : [exception.message || 'Validation failed'];

    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message: this.sanitizeValidationMessages(message),
      error: 'Validation Error',
      timestamp: context.timestamp,
      path: context.path,
      method: context.method,
      correlationId: context.correlationId,
    };
  }

  private handleUnknownError(
    exception: unknown,
    context: { timestamp: string; path: string; method: string; correlationId: string }
  ): ErrorResponse {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred. Please contact support with the correlation ID.',
      error: 'Internal Server Error',
      timestamp: context.timestamp,
      path: context.path,
      method: context.method,
      correlationId: context.correlationId,
    };
  }

  private isDatabaseError(exception: unknown): boolean {
    if (!exception || typeof exception !== 'object') return false;
    
    const error = exception as any;
    return (
      error.name === 'QueryFailedError' ||
      error.name === 'EntityNotFoundError' ||
      error.code?.startsWith('23') || // PostgreSQL constraint violations
      error.message?.includes('SQLITE_') || // SQLite errors
      error.message?.includes('constraint')
    );
  }

  private isValidationError(exception: unknown): boolean {
    if (!exception || typeof exception !== 'object') return false;
    
    const error = exception as any;
    return (
      error.name === 'ValidationError' ||
      error.name === 'BadRequestException' ||
      (Array.isArray(error.message) && error.statusCode === 400)
    );
  }

  private sanitizeMessage(message: string | string[]): string | string[] {
    if (Array.isArray(message)) {
      return message.map(msg => this.sanitizeSingleMessage(msg));
    }
    return this.sanitizeSingleMessage(message);
  }

  private sanitizeSingleMessage(message: string): string {
    // Remove file paths
    message = message.replace(/\/.*?\/.*?\.js:\d+:\d+/g, '[file]');
    message = message.replace(/\/.*?\/.*?\.ts:\d+:\d+/g, '[file]');
    
    // Remove stack traces in error messages
    message = message.split('\n')[0];
    
    // Remove SQL injection attempts
    message = message.replace(/union|select|insert|update|delete|drop|create|alter/gi, '[sql]');
    
    return message;
  }

  private sanitizeValidationMessages(messages: string[]): string[] {
    return messages.map(message => {
      // Convert technical validation messages to user-friendly ones
      if (message.includes('must be') && message.includes('email')) {
        return 'Please enter a valid email address.';
      }
      if (message.includes('must be') && message.includes('number')) {
        return 'Please enter a valid number.';
      }
      if (message.includes('should not be empty')) {
        return 'This field is required.';
      }
      if (message.includes('must be longer than')) {
        return 'This field is too short.';
      }
      if (message.includes('must be shorter than')) {
        return 'This field is too long.';
      }
      
      return this.sanitizeSingleMessage(message);
    });
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private logError(exception: unknown, request: Request, errorResponse: ErrorResponse): void {
    const userId = (request as any).user?.id || 'anonymous';
    const userAgent = request.headers['user-agent'] || 'unknown';
    const ip = request.ip || 'unknown';

    const logContext = {
      correlationId: errorResponse.correlationId,
      userId,
      userAgent,
      ip,
      path: errorResponse.path,
      method: errorResponse.method,
      statusCode: errorResponse.statusCode,
    };

    if (errorResponse.statusCode >= 500) {
      // Log full error details for server errors
      this.logger.error(
        `Server Error: ${errorResponse.message}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
        JSON.stringify(logContext)
      );
    } else if (errorResponse.statusCode >= 400) {
      // Log client errors with less detail
      this.logger.warn(
        `Client Error: ${errorResponse.message}`,
        JSON.stringify(logContext)
      );
    }
  }
} 