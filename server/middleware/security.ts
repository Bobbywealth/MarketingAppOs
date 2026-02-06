/**
 * Security middleware for MarketingAppOs
 * Includes rate limiting, input validation, and request sanitization
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Errors } from '../../shared/errors';

/**
 * Rate limiting configuration
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter rate limiting for sensitive endpoints
 */
export const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting for email sending
 */
export const emailRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit to 50 emails per hour
  message: 'Too many email requests, please try again later.',
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip;
  },
});

/**
 * Input validation middleware factory
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      const validationError = Errors.validation(
        error.errors[0]?.message || 'Invalid input data'
      );
      return res.status(400).json({
        success: false,
        error: validationError.code,
        message: validationError.message,
        details: error.errors,
      });
    }
  };
}

/**
 * Query parameter validation middleware factory
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      const validationError = Errors.validation(
        error.errors[0]?.message || 'Invalid query parameters'
      );
      return res.status(400).json({
        success: false,
        error: validationError.code,
        message: validationError.message,
        details: error.errors,
      });
    }
  };
}

/**
 * Request ID middleware
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  req.id = req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
}

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  next();
}

/**
 * CORS middleware (if needed)
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:5000',
    'http://localhost:3000',
    'https://www.marketingteam.app',
  ];
  
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
}

/**
 * Authentication check middleware
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.session?.userId) {
    throw Errors.unauthorized('Authentication required');
  }
  next();
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    
    if (!user) {
      throw Errors.unauthorized('Authentication required');
    }
    
    if (!allowedRoles.includes(user.role)) {
      throw Errors.businessLogicError(
        `Role '${user.role}' is not allowed to access this resource`
      );
    }
    
    next();
  };
}

/**
 * Error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Handle AppError instances
  if (err instanceof Error && 'code' in err) {
    const appError = err as any;
    
    console.error(`[${appError.code}] ${err.message}`, {
      requestId: req.id,
      userId: req.user?.id,
      path: req.path,
      stack: err.stack,
    });
    
    return res.status(appError.statusCode || 500).json({
      success: false,
      error: appError.code,
      message: appError.message,
      ...(appError.context && { context: appError.context }),
      requestId: req.id,
    });
  }
  
  // Handle unexpected errors
  console.error('[UNEXPECTED_ERROR]', err.message, {
    requestId: req.id,
    userId: req.user?.id,
    path: req.path,
    stack: err.stack,
  });
  
  return res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    requestId: req.id,
  });
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    error: 'RECORD_NOT_FOUND',
    message: 'The requested resource was not found',
    requestId: req.id,
  });
}

/**
 * Apply all security middleware in order
 */
export function applySecurityMiddleware(app: any) {
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));
  
  // Security headers
  app.use(securityHeaders);
  
  // Request ID
  app.use(requestId);
  
  // Body parser limits
  app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      // Limit request body size to 10MB
      const contentLength = parseInt(req.headers['content-length'] || '0');
      if (contentLength > 10 * 1024 * 1024) {
        return res.status(413).json({
          success: false,
          error: 'FILE_SIZE_EXCEEDED',
          message: 'Request body too large. Maximum size is 10MB.',
        });
      }
    }
    next();
  });
  
  // Error handler (must be last)
  app.use(errorHandler);
  
  // 404 handler
  app.use(notFoundHandler);
}
