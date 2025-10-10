# Marketing Team App CRM

## Overview

Marketing Team App CRM (MTA CRM) is a comprehensive customer relationship management system designed specifically for digital marketing agencies. The application manages the complete client lifecycle including client profiles, campaign tracking, lead pipeline management, content approval workflows, invoicing, ticket support, onboarding processes, and team communication.

The system is built as a modern full-stack web application with a React-based frontend and Express.js backend, featuring real-time data synchronization, role-based access control, and a premium glass morphism design system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server with hot module replacement
- **Wouter** for lightweight client-side routing
- **TanStack Query (React Query)** for server state management, caching, and data synchronization

**UI Component System:**
- **Shadcn/ui** component library built on Radix UI primitives for accessible, unstyled components
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Design Philosophy:** Premium SaaS aesthetic with glass morphism, depth layers, gradients, and sophisticated animations inspired by Linear, Stripe Dashboard, and Vercel

**State Management Strategy:**
- Server state managed via React Query with aggressive caching (`staleTime: Infinity`)
- Local UI state managed with React hooks
- Authentication state synchronized through React Query with special 401 handling
- Form state managed with React Hook Form and Zod validation

**Key Design Patterns:**
- Component composition using Radix UI Slot pattern for flexible, reusable components
- Custom hooks for cross-cutting concerns (useAuth, usePermissions, useToast)
- Centralized API client with credential inclusion for authenticated requests
- Path aliases (@/, @shared/, @assets/) for clean imports

### Backend Architecture

**Server Framework:**
- **Express.js** with TypeScript running on Node.js
- **HTTP server** created separately to support future WebSocket/real-time features
- Middleware pipeline for logging, JSON parsing, and error handling

**Authentication & Authorization:**
- **Replit Auth (OpenID Connect)** for user authentication via OAuth flow
- **Passport.js** with OpenID Client strategy for session management
- **Express Session** with PostgreSQL-backed session store for persistence
- **Role-Based Access Control (RBAC)** with three roles: Admin, Staff, Client
- Granular permissions system controlling access to specific features

**API Design:**
- RESTful endpoints organized by resource (clients, campaigns, leads, etc.)
- Consistent error handling with structured validation errors
- Request/response logging with timing metrics
- Zod schema validation on all input data

**Database Layer:**
- **Drizzle ORM** for type-safe database operations and migrations
- **Neon Serverless PostgreSQL** with WebSocket support for serverless deployments
- Connection pooling via @neondatabase/serverless
- Schema-first design with TypeScript types auto-generated from Drizzle schemas

### Data Storage Solutions

**Primary Database (PostgreSQL):**
- **Schema Design:** Normalized relational model with foreign key relationships
- **Key Tables:** users, clients, campaigns, tasks, leads, contentPosts, invoices, tickets, messages, onboardingTasks, clientDocuments, sessions
- **Relationships:** One-to-many (client→campaigns, client→leads) and many-to-many via junction patterns
- **Timestamps:** Automatic created_at/updated_at tracking on all entities
- **Data Types:** Extensive use of JSONB for flexible metadata and arrays for tags/categories

**File Storage (Google Cloud Storage):**
- **Object Storage Service** abstraction layer for file uploads
- **Replit Sidecar** integration for credential management
- **ACL System:** Custom object-level access control with owner/visibility/permissions model
- **Uppy Integration:** Client-side file uploader with AWS S3-compatible uploads

**Session Storage:**
- PostgreSQL table for persistent sessions (connect-pg-simple)
- 7-day session TTL with HTTP-only secure cookies

### Authentication and Authorization

**Authentication Flow:**
- OpenID Connect discovery with Replit as identity provider
- Authorization code flow with PKCE
- Session-based authentication with encrypted cookies
- Automatic token refresh and session updates

**Authorization Model:**
- **Role Hierarchy:** Admin > Staff > Client
- **Permission Mapping:** Each role mapped to specific capabilities (canManageUsers, canManageClients, etc.)
- **Middleware Guards:** requireRole() and requirePermission() decorators for route protection
- **Client-Side Enforcement:** usePermissions() hook for conditional UI rendering

**Security Measures:**
- CSRF protection via session middleware
- HTTP-only, secure cookies in production
- Credential inclusion on all authenticated requests
- 401 handling with special returnNull option for public routes

### External Dependencies

**Cloud Services:**
- **Google Cloud Storage:** Object/file storage with Replit-managed credentials
- **Neon Database:** Serverless PostgreSQL with WebSocket support for connection pooling
- **Replit Infrastructure:** OIDC authentication provider, sidecar service for secrets management

**Payment Processing (Future/Partial):**
- **Stripe:** Integration scaffolded with @stripe/stripe-js and @stripe/react-stripe-js

**Third-Party Libraries:**
- **Radix UI:** Accessible component primitives (accordion, dialog, dropdown, popover, etc.)
- **Uppy:** File upload library with dashboard UI and S3 compatibility
- **Memoizee:** Function memoization for OIDC config caching
- **Zod:** Runtime type validation and schema parsing
- **Drizzle Kit:** Database migration management

**Development Tools:**
- **Replit Vite Plugins:** Runtime error modal, cartographer (dev tools), dev banner
- **TSX:** TypeScript execution for development server
- **ESBuild:** Production bundling for server code