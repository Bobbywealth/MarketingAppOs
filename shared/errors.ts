/**
 * Centralized error types and handling for MarketingAppOs
 */

export enum ErrorCode {
  // Network & Connection Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',

  // Authentication & Authorization Errors
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',

  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DATABASE_CONSTRAINT_ERROR = 'DATABASE_CONSTRAINT_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',

  // External Service Errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SMTP_ERROR = 'SMTP_ERROR',
  TWILIO_ERROR = 'TWILIO_ERROR',
  STRIPE_ERROR = 'STRIPE_ERROR',
  GOOGLE_API_ERROR = 'GOOGLE_API_ERROR',
  MICROSOFT_GRAPH_ERROR = 'MICROSOFT_GRAPH_ERROR',
  OPENAI_ERROR = 'OPENAI_ERROR',
  VAPI_ERROR = 'VAPI_ERROR',

  // Business Logic Errors
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',

  // Rate Limiting
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Circuit Breaker
  CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',

  // File & Storage Errors
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',

  // Payment Errors
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
  PAYMENT_REQUIRES_ACTION = 'PAYMENT_REQUIRES_ACTION',

  // Generic Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export interface ErrorContext {
  service?: string;
  operation?: string;
  userId?: number;
  requestId?: string;
  additionalData?: Record<string, any>;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly context?: ErrorContext;
  public readonly statusCode: number;
  public readonly originalError?: Error;

  constructor(
    code: ErrorCode,
    message: string,
    context?: ErrorContext,
    statusCode: number = 500,
    originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      statusCode: this.statusCode,
      ...(this.originalError && { originalError: this.originalError.message }),
    };
  }
}

/**
 * Get HTTP status code for error code
 */
export function getStatusCode(errorCode: ErrorCode): number {
  const statusCodeMap: Record<ErrorCode, number> = {
    // 4xx Client Errors
    [ErrorCode.VALIDATION_ERROR]: 400,
    [ErrorCode.INVALID_INPUT]: 400,
    [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
    [ErrorCode.INVALID_FORMAT]: 400,
    [ErrorCode.AUTHENTICATION_ERROR]: 401,
    [ErrorCode.AUTHORIZATION_ERROR]: 403,
    [ErrorCode.INVALID_CREDENTIALS]: 401,
    [ErrorCode.SESSION_EXPIRED]: 401,
    [ErrorCode.TOKEN_INVALID]: 401,
    [ErrorCode.OPERATION_NOT_ALLOWED]: 403,
    [ErrorCode.RATE_LIMIT_ERROR]: 429,
    [ErrorCode.TOO_MANY_REQUESTS]: 429,
    [ErrorCode.RECORD_NOT_FOUND]: 404,

    // 5xx Server Errors
    [ErrorCode.NETWORK_ERROR]: 503,
    [ErrorCode.CONNECTION_TIMEOUT]: 504,
    [ErrorCode.CONNECTION_REFUSED]: 503,
    [ErrorCode.DATABASE_ERROR]: 500,
    [ErrorCode.DATABASE_CONNECTION_ERROR]: 503,
    [ErrorCode.DATABASE_QUERY_ERROR]: 500,
    [ErrorCode.DATABASE_CONSTRAINT_ERROR]: 409,
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
    [ErrorCode.SMTP_ERROR]: 502,
    [ErrorCode.TWILIO_ERROR]: 502,
    [ErrorCode.STRIPE_ERROR]: 502,
    [ErrorCode.GOOGLE_API_ERROR]: 502,
    [ErrorCode.MICROSOFT_GRAPH_ERROR]: 502,
    [ErrorCode.OPENAI_ERROR]: 502,
    [ErrorCode.VAPI_ERROR]: 502,
    [ErrorCode.BUSINESS_LOGIC_ERROR]: 400,
    [ErrorCode.INVALID_STATE_TRANSITION]: 400,
    [ErrorCode.FILE_UPLOAD_ERROR]: 400,
    [ErrorCode.FILE_SIZE_EXCEEDED]: 413,
    [ErrorCode.INVALID_FILE_TYPE]: 415,
    [ErrorCode.PAYMENT_ERROR]: 402,
    [ErrorCode.PAYMENT_FAILED]: 402,
    [ErrorCode.PAYMENT_CANCELLED]: 402,
    [ErrorCode.PAYMENT_REQUIRES_ACTION]: 402,
    [ErrorCode.CIRCUIT_BREAKER_OPEN]: 503,
    [ErrorCode.INTERNAL_ERROR]: 500,
    [ErrorCode.NOT_IMPLEMENTED]: 501,
    [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  };

  return statusCodeMap[errorCode] || 500;
}

/**
 * Check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Wrap unknown errors in AppError
 */
export function wrapError(error: unknown, defaultCode: ErrorCode = ErrorCode.INTERNAL_ERROR): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      defaultCode,
      error.message,
      undefined,
      500,
      error
    );
  }

  return new AppError(
    defaultCode,
    'An unknown error occurred',
    undefined,
    500
  );
}

/**
 * Create specific error helpers
 */
export const Errors = {
  // Authentication
  unauthorized(message: string = 'Unauthorized access'): AppError {
    return new AppError(ErrorCode.AUTHENTICATION_ERROR, message, undefined, 401);
  },

  invalidCredentials(message: string = 'Invalid credentials provided'): AppError {
    return new AppError(ErrorCode.INVALID_CREDENTIALS, message, undefined, 401);
  },

  sessionExpired(message: string = 'Session has expired'): AppError {
    return new AppError(ErrorCode.SESSION_EXPIRED, message, undefined, 401);
  },

  // Validation
  validation(message: string, field?: string): AppError {
    return new AppError(
      ErrorCode.VALIDATION_ERROR,
      message,
      field ? { field } as ErrorContext : undefined,
      400
    );
  },

  missingField(field: string): AppError {
    return new AppError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      `Missing required field: ${field}`,
      { field } as ErrorContext,
      400
    );
  },

  invalidFormat(field: string, expected: string): AppError {
    return new AppError(
      ErrorCode.INVALID_FORMAT,
      `Invalid format for ${field}. Expected: ${expected}`,
      { field, expected } as ErrorContext,
      400
    );
  },

  // Database
  databaseError(message: string, operation?: string): AppError {
    return new AppError(
      ErrorCode.DATABASE_ERROR,
      message,
      operation ? { operation } as ErrorContext : undefined,
      500
    );
  },

  recordNotFound(resource: string, id: string): AppError {
    return new AppError(
      ErrorCode.RECORD_NOT_FOUND,
      `${resource} with id ${id} not found`,
      { resource, id } as ErrorContext,
      404
    );
  },

  duplicateRecord(resource: string, field: string): AppError {
    return new AppError(
      ErrorCode.DUPLICATE_RECORD,
      `Duplicate ${resource} with ${field}`,
      { resource, field } as ErrorContext,
      409
    );
  },

  // External Services
  smtpError(message: string, originalError?: Error): AppError {
    return new AppError(
      ErrorCode.SMTP_ERROR,
      message,
      undefined,
      502,
      originalError
    );
  },

  twilioError(message: string, originalError?: Error): AppError {
    return new AppError(
      ErrorCode.TWILIO_ERROR,
      message,
      undefined,
      502,
      originalError
    );
  },

  stripeError(message: string, originalError?: Error): AppError {
    return new AppError(
      ErrorCode.STRIPE_ERROR,
      message,
      undefined,
      502,
      originalError
    );
  },

  googleApiError(message: string, originalError?: Error): AppError {
    return new AppError(
      ErrorCode.GOOGLE_API_ERROR,
      message,
      undefined,
      502,
      originalError
    );
  },

  microsoftGraphError(message: string, originalError?: Error): AppError {
    return new AppError(
      ErrorCode.MICROSOFT_GRAPH_ERROR,
      message,
      undefined,
      502,
      originalError
    );
  },

  openaiError(message: string, originalError?: Error): AppError {
    return new AppError(
      ErrorCode.OPENAI_ERROR,
      message,
      undefined,
      502,
      originalError
    );
  },

  vapiError(message: string, originalError?: Error): AppError {
    return new AppError(
      ErrorCode.VAPI_ERROR,
      message,
      undefined,
      502,
      originalError
    );
  },

  // Rate Limiting
  rateLimit(message: string = 'Too many requests'): AppError {
    return new AppError(ErrorCode.RATE_LIMIT_ERROR, message, undefined, 429);
  },

  // Circuit Breaker
  circuitBreakerOpen(service: string): AppError {
    return new AppError(
      ErrorCode.CIRCUIT_BREAKER_OPEN,
      `Circuit breaker is open for ${service}`,
      { service } as ErrorContext,
      503
    );
  },

  // File Upload
  fileUploadError(message: string): AppError {
    return new AppError(ErrorCode.FILE_UPLOAD_ERROR, message, undefined, 400);
  },

  fileSizeExceeded(maxSize: string): AppError {
    return new AppError(
      ErrorCode.FILE_SIZE_EXCEEDED,
      `File size exceeds maximum allowed size of ${maxSize}`,
      undefined,
      413
    );
  },

  invalidFileType(type: string, allowed: string[]): AppError {
    return new AppError(
      ErrorCode.INVALID_FILE_TYPE,
      `Invalid file type: ${type}. Allowed types: ${allowed.join(', ')}`,
      { type, allowed } as ErrorContext,
      415
    );
  },

  // Payment
  paymentError(message: string, stripeError?: any): AppError {
    return new AppError(
      ErrorCode.PAYMENT_ERROR,
      message,
      undefined,
      402,
      stripeError
    );
  },

  paymentFailed(message: string): AppError {
    return new AppError(ErrorCode.PAYMENT_FAILED, message, undefined, 402);
  },

  // Business Logic
  businessLogicError(message: string, context?: ErrorContext): AppError {
    return new AppError(ErrorCode.BUSINESS_LOGIC_ERROR, message, context, 400);
  },

  invalidStateTransition(from: string, to: string): AppError {
    return new AppError(
      ErrorCode.INVALID_STATE_TRANSITION,
      `Invalid state transition from ${from} to ${to}`,
      { from, to } as ErrorContext,
      400
    );
  },

  // Internal
  internalError(message: string, originalError?: Error): AppError {
    return new AppError(ErrorCode.INTERNAL_ERROR, message, undefined, 500, originalError);
  },

  notImplemented(feature: string): AppError {
    return new AppError(
      ErrorCode.NOT_IMPLEMENTED,
      `${feature} is not implemented`,
      { feature } as ErrorContext,
      501
    );
  },

  serviceUnavailable(service: string): AppError {
    return new AppError(
      ErrorCode.SERVICE_UNAVAILABLE,
      `${service} is currently unavailable`,
      { service } as ErrorContext,
      503
    );
  },
};
