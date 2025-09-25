# Technology Stack - Krasnaya Ploshchad

## Architecture Overview
Monorepo architecture using Turborepo with two main services:
- **Backend**: AIoC Service (All In One Core)
- **Frontend**: Tere Project (Team Reporting)

## Core Technologies

### Monorepo Management
- **Turborepo**: Build orchestration and task management
- **npm Workspaces**: Package management
- **Node.js**: Runtime environment (>=18)

### Backend Stack (AIoC Service)
- **Framework**: NestJS with TypeScript
- **Runtime**: Node.js
- **Testing**: Jest with full coverage support
- **API Architecture**: RESTful services
- **Configuration**: Environment-based with @nestjs/config

### Frontend Stack (Tere Project)
- **Framework**: Next.js 15 (App Router)
- **Runtime**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Ant Design (@ant-design/icons)
- **State Management**: 
  - **Client State**: Zustand
  - **Server State**: TanStack React Query
- **Charts**: Recharts for data visualization

### External Integrations
- **Firebase**: Data storage and authentication (both client and admin SDKs)
- **Jira API**: Primary data source for issue tracking and metrics collection

### Development Tools
- **Linting**: ESLint with Prettier formatting
- **Type Checking**: TypeScript strict mode
- **Testing**: Jest for unit testing
- **Package Manager**: npm 10.9.2
- **Build Tools**: Turbo for orchestration

### Deployment & Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **Environment**: Environment variable based configuration

## Security Considerations
- **Data Privacy**: Jira data must not be publicly exposed
- **Credential Management**: Jira API credentials must be securely stored and not published
- **Environment Variables**: Sensitive configuration through .env files (not committed)

## Performance Requirements
- No specific performance constraints identified
- Standard web application responsiveness expected

## Development Workflow
- **Build**: `npm run build` (Turborepo orchestrated)
- **Development**: `npm run dev` (Hot reload enabled)
- **Linting**: `npm run lint` (ESLint + Prettier)
- **Type Checking**: `npm run check-types`
- **Testing**: Jest-based testing strategy

## Technical Decisions
- **Monorepo**: Chosen for shared configuration and coordinated releases
- **NestJS**: Selected for enterprise-grade Node.js backend architecture
- **Next.js**: Chosen for modern React development with excellent performance
- **Firebase**: Selected for managed backend services and real-time capabilities
- **TypeScript**: Enforced across all services for type safety