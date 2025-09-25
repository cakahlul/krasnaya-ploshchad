# Project Structure - Krasnaya Ploshchad

## Monorepo Organization

```
krasnaya-ploshchad/
├── apps/
│   ├── aioc-service/     # Backend NestJS service
│   └── tere-project/     # Frontend Next.js application
├── packages/             # Shared packages (currently empty)
├── .claude/              # Claude Code configuration
└── turbo.json           # Turborepo configuration
```

## Backend Structure (AIoC Service)

### Directory Layout
```
apps/aioc-service/src/
├── app.controller.ts     # Main application controller
├── app.module.ts         # Root application module
├── app.service.ts        # Main application service
├── auth/                 # Authentication modules
├── common/               # Shared utilities and helpers
├── config/               # Configuration modules
└── [feature-modules]/    # Feature-specific modules
```

### NestJS Conventions
- **Modules**: Each feature should have its own module
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and data processing
- **DTOs**: Data Transfer Objects for validation
- **Guards**: Authentication and authorization
- **Interceptors**: Cross-cutting concerns
- **Testing**: `.spec.ts` files alongside source files

### New Feature Organization
- Follow NestJS best practices
- Create dedicated modules for major features
- Use dependency injection patterns
- Maintain separation of concerns

## Frontend Structure (Tere Project)

### Directory Layout
```
apps/tere-project/src/
├── app/                  # Next.js App Router pages
├── components/           # Reusable UI components
├── features/             # Feature-specific components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
└── store/                # Zustand state management
```

### Next.js Conventions
- **App Router**: Use Next.js 13+ app directory structure
- **Components**: Organized by feature and reusability
- **Server Components**: Default to server components when possible
- **Client Components**: Use "use client" directive when needed
- **API Routes**: Place in `app/api/` directory

### Component Organization
- **Shared Components**: Place in `src/components/`
- **Feature Components**: Place in `src/features/[feature-name]/`
- **Page Components**: Place in `src/app/` following route structure
- **Custom Hooks**: Place in `src/hooks/`

### State Management
- **Zustand**: For client-side state
- **TanStack React Query**: For server state and caching
- **Store Structure**: Organized by feature in `src/store/`

## Coding Conventions

### General Standards
- **Language**: TypeScript throughout the entire codebase
- **Linting**: ESLint with Prettier formatting (automated)
- **File Naming**: kebab-case for files and directories
- **Component Naming**: PascalCase for React components
- **Variable Naming**: camelCase for variables and functions

### Import Organization
- **External libraries** first
- **Internal modules** second
- **Relative imports** last
- Use absolute imports when possible

### Environment Configuration
- **Development**: `.env.local` for local overrides
- **Production**: Environment variables through deployment platform
- **Security**: Never commit sensitive credentials

## Testing Strategy

### Testing Requirements
- **Unit Tests**: Jest for both frontend and backend
- **Coverage**: Aim for comprehensive test coverage
- **Integration Tests**: Test API endpoints and component interactions
- **E2E Tests**: Available in backend (`test:e2e`)

### Test Organization
- **Backend**: Tests alongside source files (`.spec.ts`)
- **Frontend**: Tests alongside components and features
- **Mocking**: Mock external services (Jira API, Firebase)
- **Test Data**: Use realistic but anonymized data

## Development Workflow

### Branch Strategy
- **Development**: Main development branch
- **Feature Branches**: For new features and bug fixes
- **Pull Requests**: Required for code review

### Build Process
- **Turborepo**: Orchestrates builds across all packages
- **Parallel Execution**: Tasks run in parallel when possible
- **Caching**: Build artifacts cached for performance
- **Type Checking**: Required before builds

### Docker Development
- **Local Development**: Docker Compose for full stack
- **Service Isolation**: Each service can be developed independently
- **Environment Parity**: Development matches production environment

## New Feature Guidelines

### Backend Features (AIoC)
1. Create feature module in appropriate directory
2. Follow NestJS module structure (controller, service, module)
3. Add proper DTOs for validation
4. Include unit tests
5. Update module imports in `app.module.ts`

### Frontend Features (Tere)
1. Create feature directory in `src/features/`
2. Follow existing component patterns
3. Use TypeScript for all components
4. Integrate with Zustand store if needed
5. Add to appropriate route in `src/app/`

### Shared Code
- Place shared utilities in appropriate service's `common/` or `lib/` directory
- Consider creating shared package in `packages/` for cross-service code
- Maintain clear boundaries between services