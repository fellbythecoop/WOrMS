"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const errorResponse = this.buildErrorResponse(exception, request);
        this.logError(exception, request, errorResponse);
        response.status(errorResponse.statusCode).json(errorResponse);
    }
    buildErrorResponse(exception, request) {
        const timestamp = new Date().toISOString();
        const path = request.url;
        const method = request.method;
        const correlationId = this.generateCorrelationId();
        if (exception instanceof common_1.HttpException) {
            return this.handleHttpException(exception, { timestamp, path, method, correlationId });
        }
        if (this.isDatabaseError(exception)) {
            return this.handleDatabaseError(exception, { timestamp, path, method, correlationId });
        }
        if (this.isValidationError(exception)) {
            return this.handleValidationError(exception, { timestamp, path, method, correlationId });
        }
        return this.handleUnknownError(exception, { timestamp, path, method, correlationId });
    }
    handleHttpException(exception, context) {
        const status = exception.getStatus();
        const response = exception.getResponse();
        let message;
        let error;
        if (typeof response === 'object' && response !== null) {
            const responseObj = response;
            message = responseObj.message || exception.message;
            error = responseObj.error || exception.name;
        }
        else {
            message = response;
            error = exception.name;
        }
        if (status === common_1.HttpStatus.INTERNAL_SERVER_ERROR) {
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
    handleDatabaseError(exception, context) {
        if (exception.code === '23505' || exception.message?.includes('UNIQUE constraint')) {
            return {
                statusCode: common_1.HttpStatus.CONFLICT,
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
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                message: 'Cannot perform this operation due to related data constraints.',
                error: 'Constraint Violation',
                timestamp: context.timestamp,
                path: context.path,
                method: context.method,
                correlationId: context.correlationId,
            };
        }
        return {
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'A database error occurred. Please try again later.',
            error: 'Database Error',
            timestamp: context.timestamp,
            path: context.path,
            method: context.method,
            correlationId: context.correlationId,
        };
    }
    handleValidationError(exception, context) {
        const message = Array.isArray(exception.message)
            ? exception.message
            : [exception.message || 'Validation failed'];
        return {
            statusCode: common_1.HttpStatus.BAD_REQUEST,
            message: this.sanitizeValidationMessages(message),
            error: 'Validation Error',
            timestamp: context.timestamp,
            path: context.path,
            method: context.method,
            correlationId: context.correlationId,
        };
    }
    handleUnknownError(exception, context) {
        return {
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'An unexpected error occurred. Please contact support with the correlation ID.',
            error: 'Internal Server Error',
            timestamp: context.timestamp,
            path: context.path,
            method: context.method,
            correlationId: context.correlationId,
        };
    }
    isDatabaseError(exception) {
        if (!exception || typeof exception !== 'object')
            return false;
        const error = exception;
        return (error.name === 'QueryFailedError' ||
            error.name === 'EntityNotFoundError' ||
            error.code?.startsWith('23') ||
            error.message?.includes('SQLITE_') ||
            error.message?.includes('constraint'));
    }
    isValidationError(exception) {
        if (!exception || typeof exception !== 'object')
            return false;
        const error = exception;
        return (error.name === 'ValidationError' ||
            error.name === 'BadRequestException' ||
            (Array.isArray(error.message) && error.statusCode === 400));
    }
    sanitizeMessage(message) {
        if (Array.isArray(message)) {
            return message.map(msg => this.sanitizeSingleMessage(msg));
        }
        return this.sanitizeSingleMessage(message);
    }
    sanitizeSingleMessage(message) {
        message = message.replace(/\/.*?\/.*?\.js:\d+:\d+/g, '[file]');
        message = message.replace(/\/.*?\/.*?\.ts:\d+:\d+/g, '[file]');
        message = message.split('\n')[0];
        message = message.replace(/union|select|insert|update|delete|drop|create|alter/gi, '[sql]');
        return message;
    }
    sanitizeValidationMessages(messages) {
        return messages.map(message => {
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
    generateCorrelationId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    logError(exception, request, errorResponse) {
        const userId = request.user?.id || 'anonymous';
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
            this.logger.error(`Server Error: ${errorResponse.message}`, exception instanceof Error ? exception.stack : JSON.stringify(exception), JSON.stringify(logContext));
        }
        else if (errorResponse.statusCode >= 400) {
            this.logger.warn(`Client Error: ${errorResponse.message}`, JSON.stringify(logContext));
        }
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map