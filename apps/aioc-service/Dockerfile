# Multi-stage build for production
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/aioc-service/package*.json ./apps/aioc-service/

# Install dependencies including dev dependencies for build
RUN npm install && npm cache clean --force

# Copy source code
COPY apps/aioc-service ./apps/aioc-service
COPY turbo.json ./

# Build the application
WORKDIR /app/apps/aioc-service
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Create app directory
WORKDIR /app

# Copy package files from both root and service
COPY package*.json ./
COPY apps/aioc-service/package*.json ./apps/aioc-service/

# Install dependencies in the correct workspace
WORKDIR /app/apps/aioc-service
RUN npm install --omit=dev && npm cache clean --force

# Copy built application
COPY --from=builder /app/apps/aioc-service/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/ || exit 1

# Start the application
CMD ["node", "dist/main.js"]