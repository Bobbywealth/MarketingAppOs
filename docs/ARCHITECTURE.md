# MarketingAppOs Architecture Documentation

## Overview

MarketingAppOs is a full-stack CRM and operations platform built with React, Node.js, Express, PostgreSQL, and Drizzle ORM. This document describes the system architecture, key components, and design patterns used throughout the application.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Architecture Patterns](#architecture-patterns)
4. [Core Components](#core-components)
5. [Data Layer](#data-layer)
6. [API Layer](#api-layer)
7. [Security](#security)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Performance Optimization](#performance-optimization)

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI + Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js 20 with TypeScript
- **Framework**: Express
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Session Management**: Express Session
- **Authentication**: Passport.js (local strategy)
- **Email**: Nodemailer
- **SMS**: Twilio
- **Payments**: Stripe
- **Calendar**: Google Calendar API, Microsoft Graph API
- **AI**: OpenAI API
- **Voice AI**: Vapi API
- **Push Notifications**: Web Push API

### Infrastructure
- **Hosting**: Render.com
- **Database**: Neon (PostgreSQL)
- **Email Service**: SMTP
- **File Storage**: Google Cloud Storage

## Project Structure

```
MarketingAppOs/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                # Utility functions
│   │   └── utils/              # Helper utilities
│   ├── public/                  # Static assets
│   └── index.html              # Entry point
├── server/                      # Node.js backend
│   ├── routes/                  # API route handlers
│   ├── lib/                     # Internal libraries
│   │   └── circuit-breaker.ts # Circuit breaker pattern
│   ├── middleware/               # Express middleware
│   ├── services/                 # Business logic services
│   ├── infrastructure/            # Infrastructure services
│   │   ├── cache/              # Cache service
│   │   └── config/             # Config management
│   ├── storage.ts                # Database operations
│   ├── emailService.ts           # Email service
│   ├── notificationService.ts     # Notification service
│   └── index.ts                 # Application entry point
├── shared/                      # Shared types and schemas
│   ├── errors.ts                 # Error handling types
│   └── schema.ts                 # Database schemas
├── migrations/                   # Database migrations
│   ├── scripts/                 # Migration execution scripts
│   └── sql/                     # Raw SQL files
├── docs/                        # Documentation
│   ├── api-spec.yaml            # OpenAPI specification
│   └── ARCHITECTURE.md        # This file
├── tests/                       # Test suites
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   ├── e2e/                     # End-to-end tests
│   └── setup.ts                 # Test setup
├── .github/                      # GitHub workflows
│   └── workflows/               # CI/CD pipelines
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite configuration
├── drizzle.config.ts            # Drizzle configuration
└── dockerfile                   # Docker configuration
```

## Architecture Patterns

### Service Layer Pattern

The application follows a service-oriented architecture with clear separation of concerns:

```typescript
// Base service class with common patterns
abstract class BaseService {
  protected logger: Logger;
  protected cache: CacheService;
  protected circuitBreaker: CircuitBreaker;

  protected async executeWithCircuit<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    return this.circuitBreaker.execute(operation);
  }
}

// Example service implementation
class EmailService extends BaseService {
  async sendEmail(data: EmailData): Promise<EmailResult> {
    return this.executeWithCircuit(
      async () => {
        // Email logic
      },
      'EmailService.sendEmail'
    );
  }
}
```

### Circuit Breaker Pattern

The circuit breaker pattern is implemented to handle external service failures gracefully:

```typescript
export enum CircuitState {
  CLOSED,    // Normal operation
  OPEN,      // Service is failing, stop calling it
  HALF_OPEN  // Testing if service is back up
}

export class CircuitBreaker {
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      throw new Error("Circuit breaker is OPEN");
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### Error Handling Pattern

Centralized error handling with typed error codes:

```typescript
export enum ErrorCode {
  NETWORK_ERROR,
  AUTHENTICATION_ERROR,
  VALIDATION_ERROR,
  DATABASE_ERROR,
  EXTERNAL_SERVICE_ERROR,
  RATE_LIMIT_ERROR,
  CIRCUIT_BREAKER_OPEN,
  // ... more codes
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public context?: ErrorContext,
    public statusCode: number = 500,
    public originalError?: Error
  ) {
    super(message);
  }
}
```

### Caching Strategy

In-memory caching with optional Redis backend:

```typescript
export class CacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): boolean;
  has(key: string): boolean;
  clear(): void;
  async getOrSet<T>(key: string, factory: () => Promise<T>): Promise<T>;
  cleanup(): number;
}

// Predefined cache keys
export const CacheKeys = {
  USER: (userId: number) => `user:${userId}`,
  TASK: (taskId: string) => `task:${taskId}`,
  // ... more keys
};
```

## Core Components

### Error Handling ([`shared/errors.ts`](shared/errors.ts))

Centralized error types and handling:
- **ErrorCode enum**: All possible error codes
- **AppError class**: Typed error with context and status codes
- **Errors helper factory**: Convenience methods for creating common errors
- **getStatusCode function**: Maps error codes to HTTP status codes

### Circuit Breaker ([`server/lib/circuit-breaker.ts`](server/lib/circuit-breaker.ts))

Resilience pattern for external service calls:
- **CircuitState enum**: CLOSED, OPEN, HALF_OPEN
- **CircuitBreaker class**: Manages circuit state and failure thresholds
- **Automatic recovery**: Transitions to HALF_OPEN after timeout
- **Manual reset**: Available for testing and recovery

### Cache Service ([`server/infrastructure/cache/CacheService.ts`](server/infrastructure/cache/CacheService.ts))

Performance optimization through caching:
- **In-memory cache**: Fast local storage with TTL
- **Cache-aside pattern**: getOrSet for expensive operations
- **Pattern deletion**: Delete keys by wildcard pattern
- **Automatic cleanup**: Removes expired entries
- **Predefined keys**: Consistent key naming via CacheKeys

### Environment Configuration ([`server/config/env.ts`](server/config/env.ts))

Type-safe environment variable management:
- **Zod validation**: Schema validation on startup
- **Type exports**: Fully typed environment object
- **Service status helpers**: Check if services are configured
- **Default values**: Sensible defaults for optional variables

### Security Middleware ([`server/middleware/security.ts`](server/middleware/security.ts))

Comprehensive security middleware:
- **Rate limiting**: API limiter, strict limiter, email rate limiter
- **Input validation**: Zod schema validation middleware
- **Security headers**: Content-Type-Options, X-Frame-Options, etc.
- **Authentication**: requireAuth middleware
- **Authorization**: requireRole middleware with RBAC
- **Error handling**: Centralized error handler
- **Request ID**: Unique request tracking

## Data Layer

### Storage ([`server/storage.ts`](server/storage.ts))

Database operations using Drizzle ORM:
- **CRUD operations**: Create, Read, Update, Delete for all entities
- **Query operations**: Complex queries with joins and filtering
- **Transaction support**: Database transactions
- **Error handling**: Database error mapping
- **User management**: User CRUD operations
- **Client management**: Client CRUD operations
- **Task management**: Task CRUD with comments
- **Lead management**: Lead tracking and automation
- **Campaign management**: Campaign operations
- **Calendar events**: Event management
- **Notifications**: In-app notifications
- **Analytics**: Metrics tracking

### Schema ([`shared/schema.ts`](shared/schema.ts))

Drizzle ORM schema definitions:
- **users**: User accounts and profiles
- **clients**: Client information
- **campaigns**: Marketing campaigns
- **tasks**: Task management with recurrence
- **taskSpaces**: Task organization
- **taskComments**: Task comments
- **leads**: Lead tracking
- **leadActivities**: Lead interaction history
- **leadAutomations**: Automated lead workflows
- **calendarEvents**: Calendar events with recurrence
- **notifications**: User notifications
- **emails**: Email tracking
- **emailAccounts**: Email service accounts
- **subscriptions**: User subscriptions
- **invoices**: Billing invoices
- **tickets**: Support tickets
- **messages**: Internal messaging
- **activityLogs**: System audit trail
- **pageViews**: Analytics tracking
- **marketingBroadcasts**: Email campaigns
- **marketingBroadcastRecipients**: Campaign recipients
- **scheduledAiCommands**: AI task scheduling
- **marketingSeries**: Email series
- **marketingSeriesSteps**: Series steps
- **marketingSeriesEnrollments**: User enrollments
- **commissions**: Affiliate commissions
- **secondMe**: AI assistant content
- **secondMeContent**: AI assistant content items

## API Layer

### Routes ([`server/routes/`](server/routes/))

RESTful API endpoints organized by domain:
- **Authentication**: Login, logout, session management
- **Users**: CRUD operations, permissions
- **Clients**: CRUD operations, filtering
- **Campaigns**: CRUD operations
- **Tasks**: CRUD operations, comments, recurrence
- **Leads**: CRUD operations, activities, automations
- **Calendar**: Event CRUD operations
- **Emails**: Send operations, tracking
- **SMS**: Send operations
- **Payments**: Stripe webhooks, subscriptions
- **Analytics**: Metrics retrieval
- **Content**: Content management
- **Admin**: System administration
- **Debug**: Diagnostic endpoints

### API Specification ([`docs/api-spec.yaml`](docs/api-spec.yaml))

OpenAPI 3.0 specification:
- **Authentication flows**: Login/logout endpoints
- **Resource endpoints**: Users, Clients, Campaigns, Tasks, Leads, Calendar, Emails, Analytics
- **Request/response schemas**: Fully typed using JSON Schema
- **Security schemes**: Bearer token authentication
- **Error responses**: Standardized error format
- **Tags**: Organized by domain for documentation

## Security

### Authentication & Authorization

- **Strategy**: Passport.js with local strategy
- **Session management**: Express Session with PostgreSQL store
- **Role-based access**: RBAC with roles (admin, manager, staff, sales_agent, creator, client)
- **Permission system**: Role permissions in database
- **Session security**: Secure session cookies with HttpOnly

### Rate Limiting

- **API limiter**: 100 requests per 15 minutes
- **Strict limiter**: 10 requests per 5 minutes (sensitive endpoints)
- **Email limiter**: 50 emails per hour per user
- **Key-based limiting**: User ID or IP-based limits

### Input Validation

- **Zod schemas**: Runtime type validation
- **Request validation**: Middleware for body and query params
- **Sanitization**: Express-mongo-sanitize for NoSQL injection
- **File upload validation**: Type and size limits

### Security Headers

- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block
- **Strict-Transport-Security**: HSTS with preload
- **Content-Security-Policy**: Default-src 'self'
- **X-Powered-By**: Removed to hide framework

## Testing

### Test Structure

```
tests/
├── setup.ts                    # Test configuration
├── unit/                      # Unit tests
│   ├── shared/               # Shared utilities tests
│   │   ├── errors.test.ts    # 39 tests
│   │   └── schema.test.ts     # Schema validation tests
│   ├── server/               # Server-side tests
│   │   ├── config/            # Environment config tests (21 tests)
│   │   ├── infrastructure/     # Infrastructure tests
│   │   │   └── cache/        # Cache service tests (34 tests)
│   │   └── middleware/       # Security middleware tests (17 tests)
│   │   └── lib/               # Circuit breaker tests (20 tests)
│   ├── integration/             # Integration tests (TODO)
│   └── e2e/                     # End-to-end tests (TODO)
└── vitest.config.ts          # Vitest configuration
```

### Test Coverage

Current test coverage:
- **Error handling**: 39 tests
- **Environment config**: 21 tests
- **Cache service**: 34 tests
- **Circuit breaker**: 20 tests
- **Security middleware**: 17 tests
- **Total**: 131 unit tests

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui
```

## Deployment

### CI/CD Pipeline ([`.github/workflows/ci.yml`](.github/workflows/ci.yml))

GitHub Actions workflow:
- **Triggers**: Push to main, Pull requests to main
- **Test job**: Runs tests, type check, and build
- **Build job**: Creates production build
- **Deploy job**: Deploys to Render on main branch push
- **Artifacts**: Uploads coverage reports and build artifacts

### Environment Variables

Required secrets:
- `RENDER_TOKEN`: Render API token for deployment
- `RENDER_SERVICE_ID`: Render service ID

### Deployment Process

1. **Push to main** → Triggers deploy job
2. **Tests run** → Validates code quality
3. **Build created** → Production bundle generated
4. **Deploy to Render** → New version deployed
5. **Health check** → Verify deployment success

## Performance Optimization

### Caching Strategy

- **Application-level caching**: User data, permissions, client lists
- **Query result caching**: Expensive database queries
- **Rate limit caching**: Track API usage per user
- **Cache invalidation**: Automatic cleanup of stale data
- **TTL configuration**: 5 minutes default, configurable per key

### Database Optimization

- **Indexes**: Performance indexes on frequently queried columns
- **Query optimization**: Efficient joins and filtering
- **Connection pooling**: Neon connection pooling
- **Prepared statements**: Query plan caching

### Frontend Optimization

- **Code splitting**: Lazy loading with React.lazy
- **Bundle optimization**: Vite production build
- **Asset optimization**: Minified CSS, optimized images
- **Memoization**: Expensive computations cached
- **Virtual scrolling**: Large lists rendered efficiently

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run database migrations
npm run db:push

# Type checking
npm run check

# Run tests
npm test
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for code quality
- **Prettier**: Code formatting (optional)
- **Import order**: Organized imports

### Git Workflow

- **Feature branches**: Create feature branches from main
- **Commit messages**: Conventional commits (feat:, fix:, docs:, etc.)
- **Pull requests**: Code review before merging
- **Main branch**: Protected, requires review

## External Integrations

### Email Service
- **Provider**: SMTP (SendGrid compatible)
- **Features**: HTML emails, attachments, rate limiting
- **Templates**: Dynamic email templates
- **Tracking**: Message ID tracking

### SMS Service
- **Provider**: Twilio
- **Features**: SMS sending, delivery status
- **Templates**: SMS message templates

### Payment Service
- **Provider**: Stripe
- **Features**: Subscriptions, invoices, webhooks
- **Webhooks**: Real-time payment updates

### Calendar Services
- **Google Calendar**: Event synchronization
- **Microsoft Graph**: Exchange calendar integration
- **Features**: Recurring events, reminders

### AI Services
- **OpenAI**: Content generation, analysis
- **Vapi**: Voice AI assistant
- **Features**: Task parsing, AI responses

## Best Practices

### Code Organization
- **Separation of concerns**: Clear boundaries between layers
- **Single responsibility**: Each function has one purpose
- **DRY principle**: Don't repeat yourself
- **Type safety**: Use TypeScript types everywhere
- **Error handling**: Never swallow errors silently

### Security Best Practices
- **Validate all inputs**: Never trust user input
- **Use parameterized queries**: Prevent SQL injection
- **Sanitize output**: Escape user-generated content
- **Rate limit**: Protect against abuse
- **Secure headers**: Set appropriate security headers
- **HTTPS only**: Production uses TLS

### Performance Best Practices
- **Cache expensive operations**: Reduce database load
- **Use pagination**: Never return all records at once
- **Lazy load**: Load data on demand
- **Optimize images**: Compress and resize images
- **Minimize re-renders**: Use React.memo appropriately
- **Debounce inputs**: Prevent excessive API calls

## Monitoring & Observability

### Logging
- **Structured logging**: Consistent log format
- **Error tracking**: All errors logged with context
- **Performance metrics**: Response times tracked
- **Circuit breaker status**: Service health monitored

### Health Checks
- **Database connectivity**: Connection status monitored
- **External service health**: Circuit breaker states tracked
- **API response times**: Performance metrics collected

## Future Improvements

### Planned Enhancements
- [ ] Redis caching: Replace in-memory cache with Redis
- [ ] WebSocket support: Real-time updates
- [ ] GraphQL API: Alternative to REST
- [ ] Microservices architecture: Split monolithic backend
- [ ] Event sourcing: Audit trail for all changes
- [ ] Read replicas: Database read scaling
- [ ] CDN integration: Static asset delivery
- [ ] Advanced analytics: User behavior tracking

## Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m "feat: add my feature"`
6. Push and create PR: `git push origin feature/my-feature`

### Code Review Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass
- Request review from team members

## License

MIT License - See LICENSE file for details
