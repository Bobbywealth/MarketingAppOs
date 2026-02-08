import { describe, it, expect } from 'vitest';
import {
  ErrorCode,
  AppError,
  getStatusCode,
  isAppError,
  wrapError,
  Errors,
} from '../../../shared/errors';

describe('ErrorCode', () => {
  it('should have all expected error codes', () => {
    expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(ErrorCode.AUTHENTICATION_ERROR).toBe('AUTHENTICATION_ERROR');
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
    expect(ErrorCode.EXTERNAL_SERVICE_ERROR).toBe('EXTERNAL_SERVICE_ERROR');
    expect(ErrorCode.RATE_LIMIT_ERROR).toBe('RATE_LIMIT_ERROR');
    expect(ErrorCode.CIRCUIT_BREAKER_OPEN).toBe('CIRCUIT_BREAKER_OPEN');
    expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
  });
});

describe('AppError', () => {
  it('should create an AppError with all properties', () => {
    const context = {
      service: 'EmailService',
      operation: 'sendEmail',
      userId: 123,
    };

    const error = new AppError(
      ErrorCode.SMTP_ERROR,
      'Failed to send email',
      context,
      502,
      new Error('SMTP connection failed')
    );

    expect(error.name).toBe('AppError');
    expect(error.code).toBe(ErrorCode.SMTP_ERROR);
    expect(error.message).toBe('Failed to send email');
    expect(error.context).toEqual(context);
    expect(error.statusCode).toBe(502);
    expect(error.originalError).toBeDefined();
  });

  it('should serialize to JSON correctly', () => {
    const error = new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Invalid input',
      { field: 'email' },
      400
    );

    const json = error.toJSON();

    expect(json).toEqual({
      name: 'AppError',
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      context: { field: 'email' },
      statusCode: 400,
    });
  });

  it('should include original error message in JSON when present', () => {
    const originalError = new Error('Something went wrong');
    const error = new AppError(
      ErrorCode.INTERNAL_ERROR,
      'An error occurred',
      undefined,
      500,
      originalError
    );

    const json = error.toJSON();

    expect(json.originalError).toBe('Something went wrong');
  });
});

describe('getStatusCode', () => {
  it('should return correct status codes for error codes', () => {
    expect(getStatusCode(ErrorCode.VALIDATION_ERROR)).toBe(400);
    expect(getStatusCode(ErrorCode.AUTHENTICATION_ERROR)).toBe(401);
    expect(getStatusCode(ErrorCode.AUTHORIZATION_ERROR)).toBe(403);
    expect(getStatusCode(ErrorCode.RATE_LIMIT_ERROR)).toBe(429);
    expect(getStatusCode(ErrorCode.RECORD_NOT_FOUND)).toBe(404);
    expect(getStatusCode(ErrorCode.DATABASE_ERROR)).toBe(500);
    expect(getStatusCode(ErrorCode.EXTERNAL_SERVICE_ERROR)).toBe(502);
    expect(getStatusCode(ErrorCode.CIRCUIT_BREAKER_OPEN)).toBe(503);
    expect(getStatusCode(ErrorCode.INTERNAL_ERROR)).toBe(500);
  });

  it('should return 500 for unknown error codes', () => {
    // @ts-expect-error - Testing unknown error code
    expect(getStatusCode('UNKNOWN_ERROR')).toBe(500);
  });
});

describe('isAppError', () => {
  it('should return true for AppError instances', () => {
    const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Test error');
    expect(isAppError(error)).toBe(true);
  });

  it('should return false for regular Error instances', () => {
    const error = new Error('Regular error');
    expect(isAppError(error)).toBe(false);
  });

  it('should return false for non-Error values', () => {
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError('string')).toBe(false);
    expect(isAppError(123)).toBe(false);
  });
});

describe('wrapError', () => {
  it('should return AppError as-is', () => {
    const appError = new AppError(ErrorCode.VALIDATION_ERROR, 'Test error');
    const wrapped = wrapError(appError);

    expect(wrapped).toBe(appError);
  });

  it('should wrap regular Error in AppError', () => {
    const error = new Error('Something went wrong');
    const wrapped = wrapError(error, ErrorCode.INTERNAL_ERROR);

    expect(isAppError(wrapped)).toBe(true);
    expect(wrapped.message).toBe('Something went wrong');
    expect(wrapped.originalError).toBe(error);
  });

  it('should wrap unknown values in AppError', () => {
    const wrapped = wrapError(null, ErrorCode.VALIDATION_ERROR);

    expect(isAppError(wrapped)).toBe(true);
    expect(wrapped.message).toBe('An unknown error occurred');
  });

  it('should use default error code when not specified', () => {
    const error = new Error('Test error');
    const wrapped = wrapError(error);

    expect(wrapped.code).toBe(ErrorCode.INTERNAL_ERROR);
  });
});

describe('Errors helper', () => {
  describe('Authentication errors', () => {
    it('should create unauthorized error', () => {
      const error = Errors.unauthorized('Access denied');
      expect(error.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(401);
    });

    it('should create invalid credentials error', () => {
      const error = Errors.invalidCredentials();
      expect(error.code).toBe(ErrorCode.INVALID_CREDENTIALS);
      expect(error.statusCode).toBe(401);
    });

    it('should create session expired error', () => {
      const error = Errors.sessionExpired();
      expect(error.code).toBe(ErrorCode.SESSION_EXPIRED);
      expect(error.statusCode).toBe(401);
    });
  });

  describe('Validation errors', () => {
    it('should create validation error', () => {
      const error = Errors.validation('Invalid email format');
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
    });

    it('should create missing field error', () => {
      const error = Errors.missingField('email');
      expect(error.code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
      expect(error.message).toContain('email');
      expect(error.statusCode).toBe(400);
    });

    it('should create invalid format error', () => {
      const error = Errors.invalidFormat('date', 'YYYY-MM-DD');
      expect(error.code).toBe(ErrorCode.INVALID_FORMAT);
      expect(error.message).toContain('date');
      expect(error.message).toContain('YYYY-MM-DD');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('Database errors', () => {
    it('should create database error', () => {
      const error = Errors.databaseError('Connection failed', 'connect');
      expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(error.context?.operation).toBe('connect');
      expect(error.statusCode).toBe(500);
    });

    it('should create record not found error', () => {
      const error = Errors.recordNotFound('User', '123');
      expect(error.code).toBe(ErrorCode.RECORD_NOT_FOUND);
      expect(error.message).toContain('User');
      expect(error.message).toContain('123');
      expect(error.statusCode).toBe(404);
    });

    it('should create duplicate record error', () => {
      const error = Errors.duplicateRecord('User', 'email');
      expect(error.code).toBe(ErrorCode.DUPLICATE_RECORD);
      expect(error.statusCode).toBe(409);
    });
  });

  describe('External service errors', () => {
    it('should create SMTP error', () => {
      const originalError = new Error('SMTP failed');
      const error = Errors.smtpError('Email send failed', originalError);
      expect(error.code).toBe(ErrorCode.SMTP_ERROR);
      expect(error.originalError).toBe(originalError);
      expect(error.statusCode).toBe(502);
    });

    it('should create Twilio error', () => {
      const error = Errors.twilioError('SMS send failed');
      expect(error.code).toBe(ErrorCode.TWILIO_ERROR);
      expect(error.statusCode).toBe(502);
    });

    it('should create Stripe error', () => {
      const error = Errors.stripeError('Payment failed');
      expect(error.code).toBe(ErrorCode.STRIPE_ERROR);
      expect(error.statusCode).toBe(502);
    });

    it('should create Google API error', () => {
      const error = Errors.googleApiError('Calendar API error');
      expect(error.code).toBe(ErrorCode.GOOGLE_API_ERROR);
      expect(error.statusCode).toBe(502);
    });

    it('should create OpenAI error', () => {
      const error = Errors.openaiError('API limit exceeded');
      expect(error.code).toBe(ErrorCode.OPENAI_ERROR);
      expect(error.statusCode).toBe(502);
    });
  });

  describe('Rate limiting and circuit breaker errors', () => {
    it('should create rate limit error', () => {
      const error = Errors.rateLimit();
      expect(error.code).toBe(ErrorCode.RATE_LIMIT_ERROR);
      expect(error.statusCode).toBe(429);
    });

    it('should create circuit breaker open error', () => {
      const error = Errors.circuitBreakerOpen('EmailService');
      expect(error.code).toBe(ErrorCode.CIRCUIT_BREAKER_OPEN);
      expect(error.message).toContain('EmailService');
      expect(error.statusCode).toBe(503);
    });
  });

  describe('File upload errors', () => {
    it('should create file upload error', () => {
      const error = Errors.fileUploadError('Upload failed');
      expect(error.code).toBe(ErrorCode.FILE_UPLOAD_ERROR);
      expect(error.statusCode).toBe(400);
    });

    it('should create file size exceeded error', () => {
      const error = Errors.fileSizeExceeded('10MB');
      expect(error.code).toBe(ErrorCode.FILE_SIZE_EXCEEDED);
      expect(error.message).toContain('10MB');
      expect(error.statusCode).toBe(413);
    });

    it('should create invalid file type error', () => {
      const error = Errors.invalidFileType('exe', ['jpg', 'png', 'pdf']);
      expect(error.code).toBe(ErrorCode.INVALID_FILE_TYPE);
      expect(error.statusCode).toBe(415);
    });
  });

  describe('Payment errors', () => {
    it('should create payment error', () => {
      const stripeError = { type: 'card_error' };
      const error = Errors.paymentError('Card declined', stripeError);
      expect(error.code).toBe(ErrorCode.PAYMENT_ERROR);
      expect(error.statusCode).toBe(402);
    });

    it('should create payment failed error', () => {
      const error = Errors.paymentFailed('Transaction declined');
      expect(error.code).toBe(ErrorCode.PAYMENT_FAILED);
      expect(error.statusCode).toBe(402);
    });
  });

  describe('Business logic errors', () => {
    it('should create business logic error', () => {
      const context = { userId: 123 };
      const error = Errors.businessLogicError('Invalid operation', context);
      expect(error.code).toBe(ErrorCode.BUSINESS_LOGIC_ERROR);
      expect(error.context).toEqual(context);
      expect(error.statusCode).toBe(400);
    });

    it('should create invalid state transition error', () => {
      const error = Errors.invalidStateTransition('pending', 'completed');
      expect(error.code).toBe(ErrorCode.INVALID_STATE_TRANSITION);
      expect(error.message).toContain('pending');
      expect(error.message).toContain('completed');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('Internal errors', () => {
    it('should create internal error', () => {
      const originalError = new Error('Unexpected error');
      const error = Errors.internalError('Server error', originalError);
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.originalError).toBe(originalError);
      expect(error.statusCode).toBe(500);
    });

    it('should create not implemented error', () => {
      const error = Errors.notImplemented('Feature X');
      expect(error.code).toBe(ErrorCode.NOT_IMPLEMENTED);
      expect(error.message).toContain('Feature X');
      expect(error.statusCode).toBe(501);
    });

    it('should create service unavailable error', () => {
      const error = Errors.serviceUnavailable('EmailService');
      expect(error.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
      expect(error.message).toContain('EmailService');
      expect(error.statusCode).toBe(503);
    });
  });
});
