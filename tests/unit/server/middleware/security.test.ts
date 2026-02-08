import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  apiLimiter,
  strictLimiter,
  emailRateLimiter,
  validateBody,
  validateQuery,
  requestId,
  securityHeaders,
  requireAuth,
  requireRole,
  errorHandler,
  notFoundHandler,
} from '../../../../server/middleware/security';
import { z } from 'zod';

describe('Security Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      id: 'test-request-id',
      ip: '127.0.0.1',
      headers: {},
      body: {},
      query: {},
      user: { id: 1, role: 'admin' },
      session: { userId: 1 },
    };
    mockRes = {
      status: vi.fn().mockReturnThis({
        json: vi.fn(),
        setHeader: vi.fn(),
        removeHeader: vi.fn(),
      }),
      json: vi.fn(),
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };
    mockNext = vi.fn();
  });

  describe('apiLimiter', () => {
    it('should be a rate limiter function', () => {
      expect(typeof apiLimiter).toBe('function');
    });

    it('should have windowMs property', () => {
      expect(apiLimiter.windowMs).toBe(15 * 60 * 1000); // 15 minutes
    });

    it('should have max property', () => {
      expect(apiLimiter.max).toBe(100);
    });
  });

  describe('strictLimiter', () => {
    it('should be a rate limiter function', () => {
      expect(typeof strictLimiter).toBe('function');
    });

    it('should have shorter windowMs', () => {
      expect(strictLimiter.windowMs).toBe(5 * 60 * 1000); // 5 minutes
    });

    it('should have stricter max', () => {
      expect(strictLimiter.max).toBe(10);
    });
  });

  describe('emailRateLimiter', () => {
    it('should be a rate limiter function', () => {
      expect(typeof emailRateLimiter).toBe('function');
    });

    it('should have longer windowMs', () => {
      expect(emailRateLimiter.windowMs).toBe(60 * 60 * 1000); // 1 hour
    });

    it('should have max for emails', () => {
      expect(emailRateLimiter.max).toBe(50);
    });

    it('should have keyGenerator function', () => {
      expect(typeof emailRateLimiter.keyGenerator).toBe('function');
    });
  });

  describe('validateBody', () => {
    it('should return a middleware function', () => {
      const schema = z.object({ name: z.string() });
      const middleware = validateBody(schema);
      expect(typeof middleware).toBe('function');
    });

    it('should parse and validate request body', async () => {
      const schema = z.object({ name: z.string().min(1) });
      const middleware = validateBody(schema);

      mockReq.body = { name: 'Test' };
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body).toEqual({ name: 'Test' });
    });

    it('should call next with invalid data', async () => {
      const schema = z.object({ name: z.string().min(5) });
      const middleware = validateBody(schema);

      mockReq.body = { name: 'Tst' }; // Too short
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateQuery', () => {
    it('should return a middleware function', () => {
      const schema = z.object({ page: z.coerce.number() });
      const middleware = validateQuery(schema);
      expect(typeof middleware).toBe('function');
    });

    it('should parse and validate query parameters', async () => {
      const schema = z.object({ page: z.coerce.number() });
      const middleware = validateQuery(schema);

      mockReq.query = { page: '1' };
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.query).toEqual({ page: 1 });
    });

    it('should call next with invalid query', async () => {
      const schema = z.object({ page: z.coerce.number().min(1) });
      const middleware = validateQuery(schema);

      mockReq.query = { page: '0' }; // Invalid
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('requestId', () => {
    it('should set request ID header', () => {
      requestId(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', mockReq.id);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should generate request ID if not present', () => {
      const reqWithoutId = { ...mockReq, id: undefined };
      requestId(reqWithoutId as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalled();
      expect(reqWithoutId.id).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('securityHeaders', () => {
    it('should set security headers', () => {
      securityHeaders(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should remove X-Powered-By header', () => {
      mockRes.removeHeader = vi.fn();
      securityHeaders(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.removeHeader).toHaveBeenCalledWith('X-Powered-By');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAuth', () => {
    it('should call next if user is authenticated', () => {
      requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw if user is not authenticated', () => {
      const reqWithoutUser = { ...mockReq, user: undefined, session: {} };
      
      expect(() => {
        requireAuth(reqWithoutUser as Request, mockRes as Response, mockNext);
      }).toThrow();
    });
  });

  describe('requireRole', () => {
    it('should create a middleware function', () => {
      const middleware = requireRole('admin', 'manager');
      expect(typeof middleware).toBe('function');
    });

    it('should call next if user has allowed role', () => {
      const middleware = requireRole('admin', 'manager');
      mockReq.user = { id: 1, role: 'admin' };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw if user does not have allowed role', () => {
      const middleware = requireRole('admin');
      mockReq.user = { id: 1, role: 'user' };

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow();
    });

    it('should throw if user is not authenticated', () => {
      const middleware = requireRole('admin');
      mockReq.user = undefined;

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow();
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError instances', () => {
      const error = new Error('Test error') as any;
      error.code = 'VALIDATION_ERROR';
      error.statusCode = 400;
      error.message = 'Validation failed';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        requestId: mockReq.id,
      });
    });

    it('should handle unexpected errors', () => {
      const error = new Error('Unexpected error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        requestId: mockReq.id,
      });
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 response', () => {
      notFoundHandler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'RECORD_NOT_FOUND',
        message: 'The requested resource was not found',
        requestId: mockReq.id,
      });
    });
  });
});
