import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
    private buildErrorResponse;
    private handleHttpException;
    private handleDatabaseError;
    private handleValidationError;
    private handleUnknownError;
    private isDatabaseError;
    private isValidationError;
    private sanitizeMessage;
    private sanitizeSingleMessage;
    private sanitizeValidationMessages;
    private generateCorrelationId;
    private logError;
}
