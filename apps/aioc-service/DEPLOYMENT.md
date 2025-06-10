# AIOC Service Deployment Guide

This guide provides step-by-step instructions for deploying the AIOC service in various environments.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Firebase project configured
- Git access to the repository

## Environment Setup

1. **Create Environment File**
   ```bash
   cd apps/aioc-service
   cp .env.template .env
   ```

2. **Configure Environment Variables**
   Edit `.env` file with your specific values:
   ```bash
   NODE_ENV=production
   PORT=3001
   ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:3000
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_CLIENT_EMAIL=your-firebase-client-email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

## Deployment Options

### Option 1: Local Development Deployment

```bash
# Install dependencies
npm install

# Start in development mode
npm run start:dev

# Or start in production mode
npm run build
npm run start:prod
```

### Option 2: Docker Deployment

#### Quick Start
```bash
# Build and run locally
npm run deploy:local
```

#### Manual Steps
```bash
# Build the Docker image
npm run docker:build

# Run with environment file
npm run docker:run

# Or use docker-compose for full stack
npm run docker:compose:up
```

### Option 3: Production Deployment with Nginx

```bash
# Deploy with nginx reverse proxy
docker-compose --profile production up -d
```

### Option 4: Cloud Deployment

#### AWS ECS/Fargate
1. Push Docker image to ECR
2. Create ECS task definition
3. Configure environment variables
4. Deploy to ECS cluster

#### Google Cloud Run
```bash
# Build and push to GCR
docker build -t gcr.io/PROJECT_ID/aioc-service ../../ -f Dockerfile
docker push gcr.io/PROJECT_ID/aioc-service

# Deploy to Cloud Run
gcloud run deploy aioc-service \
  --image gcr.io/PROJECT_ID/aioc-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,PORT=8080
```

#### Heroku
```bash
# Login to Heroku
heroku login

# Create app
heroku create your-aioc-service

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set FIREBASE_PROJECT_ID=your-project-id
# ... set other environment variables

# Deploy
git subtree push --prefix apps/aioc-service heroku main
```

## Health Checks and Monitoring

### Health Check Endpoint
The service automatically includes health checks:
- Docker health check on port 3001
- Nginx health check at `/health`

### Monitoring Commands
```bash
# View logs
npm run docker:compose:logs

# Check container status
docker-compose ps

# View service metrics
docker stats
```

## Scaling and Load Balancing

### Horizontal Scaling with Docker Compose
```yaml
services:
  aioc-service:
    # ... existing configuration
    deploy:
      replicas: 3
```

### Load Balancer Configuration
The included nginx configuration provides:
- Load balancing across multiple instances
- Rate limiting (10 requests/second)
- Security headers
- SSL termination (when configured)

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **Firebase Keys**: Store Firebase private keys securely
3. **CORS**: Configure `ALLOWED_ORIGINS` restrictively for production
4. **SSL/TLS**: Enable HTTPS in nginx configuration for production
5. **Rate Limiting**: Configured in nginx (10 req/s with burst of 20)

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port 3001
   lsof -i :3001
   
   # Kill process
   kill -9 <PID>
   ```

2. **Docker Build Fails**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker build --no-cache -t aioc-service ../../ -f Dockerfile
   ```

3. **Firebase Authentication Issues**
   - Verify Firebase project ID
   - Check private key formatting (includes \n characters)
   - Ensure service account has proper permissions

4. **CORS Issues**
   - Update `ALLOWED_ORIGINS` environment variable
   - Verify the exact domain format (include protocol)

### Logs and Debugging

```bash
# View application logs
docker-compose logs -f aioc-service

# Debug mode (for development)
npm run start:debug

# Access container shell
docker exec -it aioc-service-container sh
```

## Maintenance

### Updates and Deployments
```bash
# Pull latest changes
git pull origin main

# Rebuild and redeploy
npm run deploy:local

# Zero-downtime deployment (production)
docker-compose up -d --no-deps aioc-service
```

### Backup and Recovery
- Environment variables: Store securely in your secrets management system
- Application state: The service is stateless, but ensure Firebase configuration is backed up
- Logs: Configure log rotation and archival

## Support

For issues and questions:
- Check application logs first
- Review environment variable configuration
- Consult the main README.md for application-specific information
- Contact: [Ahlul Esasjana](https://github.com/cakahlul)