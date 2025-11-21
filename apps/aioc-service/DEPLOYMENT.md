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

   # Google Sheets Export Feature (optional - only needed if using export functionality)
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=your-gcp-project-id
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

## Google Sheets Export Feature Setup

The talent leave export feature requires additional Google Cloud configuration to enable spreadsheet creation.

### Prerequisites
- Google Cloud Project (can be the same as or different from Firebase project)
- Google Workspace or Gmail account for receiving exported spreadsheets

### Step 1: Create Google Cloud Project (if not exists)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note the Project ID (you'll need this later)

### Step 2: Enable Required APIs

Enable the following APIs in your Google Cloud Project:

```bash
# Using gcloud CLI
gcloud services enable sheets.googleapis.com --project=YOUR_PROJECT_ID
gcloud services enable drive.googleapis.com --project=YOUR_PROJECT_ID

# Or manually in console:
# 1. Go to APIs & Services → Library
# 2. Search for "Google Sheets API" → Enable
# 3. Search for "Google Drive API" → Enable
```

### Step 3: Create Service Account

1. Go to **IAM & Admin → Service Accounts**
2. Click **Create Service Account**
3. Fill in details:
   - **Name**: `talent-leave-export-service` (or your preferred name)
   - **Description**: Service account for exporting talent leave data to Google Sheets
4. Click **Create and Continue**
5. Skip role assignment (not needed for this use case)
6. Click **Done**

### Step 4: Generate Service Account Key

1. Click on the newly created service account
2. Go to **Keys** tab
3. Click **Add Key → Create new key**
4. Select **JSON** format
5. Click **Create** - the JSON key file will download automatically
6. **IMPORTANT**: Store this file securely - it cannot be recovered if lost

### Step 5: Extract Credentials from JSON Key

Open the downloaded JSON file and extract the following values:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "talent-leave-export-service@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

### Step 6: Configure Environment Variables

Add these to your `.env` file:

```bash
# Required for Google Sheets Export
GOOGLE_SERVICE_ACCOUNT_EMAIL=talent-leave-export-service@your-project-id.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=your-project-id
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...YOUR_KEY_HERE...\n-----END PRIVATE KEY-----\n"
```

**Important notes:**
- The private key must include literal `\n` characters (not actual newlines)
- Keep the quotes around the private key
- Never commit this file to version control

### Step 7: Verify Setup

Test the export functionality:

```bash
# Start the service
npm run start:dev

# Test the export endpoint
curl -X POST http://localhost:3001/talent-leave/export \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-01-13",
    "endDate": "2025-02-09",
    "ownerEmail": "your-email@example.com"
  }'
```

You should receive an email from Google with a link to the created spreadsheet.

### Rate Limiting Configuration

The export endpoint is rate-limited to prevent abuse:
- **Limit**: 10 requests per hour per IP address
- **Response**: HTTP 429 (Too Many Requests) when limit exceeded
- **Reset**: Counter resets 1 hour after the first request

This protects against:
- Google Sheets API quota exhaustion
- Abuse of the export functionality
- Unnecessary spreadsheet creation costs

### API Quotas and Limits

Be aware of Google Sheets API quotas:
- **Read requests**: 100 requests per 100 seconds per user
- **Write requests**: 100 requests per 100 seconds per user
- **Default quota**: 300 requests per minute

The rate limiting (10 requests/hour) ensures you stay well within these limits.

### Troubleshooting Google Sheets Export

#### Issue: "Failed to create spreadsheet"

**Possible causes:**
1. **Service account credentials are invalid**
   - Verify the service account email, project ID, and private key
   - Ensure the private key includes `\n` literal characters
   - Check that the JSON key hasn't expired

2. **APIs not enabled**
   ```bash
   # Verify APIs are enabled
   gcloud services list --enabled --project=YOUR_PROJECT_ID | grep -E 'sheets|drive'
   ```

3. **Network/firewall issues**
   - Ensure the server can reach `sheets.googleapis.com`
   - Check firewall rules allow outbound HTTPS (port 443)

#### Issue: "Failed to transfer spreadsheet ownership"

**Possible causes:**
1. **Invalid owner email**
   - Email must be a valid Google account (Gmail or Google Workspace)
   - Email format must be correct

2. **Service account lacks permissions**
   - The service account creates the spreadsheet but can always transfer ownership
   - No additional permissions needed

#### Issue: "Holiday data not available"

**Note**: This is not a critical error. The export continues without holidays.

**Possible causes:**
1. **api-harilibur.vercel.app is down**
   - The export gracefully degrades and continues without holiday data
   - Check https://api-harilibur.vercel.app/api status

2. **Network issues**
   - Verify server can reach external APIs

#### Debugging

Enable debug logging:

```bash
# In development
LOG_LEVEL=debug npm run start:dev

# View detailed logs
docker-compose logs -f aioc-service | grep -i 'export\|sheets\|google'
```

### Example .env File

Complete example including Google Sheets configuration:

```bash
# Application
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://yourdomain.com

# Firebase (existing)
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-firebase-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_FIREBASE_KEY\n-----END PRIVATE KEY-----\n"

# Google Sheets Export (new)
GOOGLE_SERVICE_ACCOUNT_EMAIL=talent-leave-export@your-gcp-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=your-gcp-project
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_GOOGLE_KEY\n-----END PRIVATE KEY-----\n"
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **Firebase Keys**: Store Firebase private keys securely
3. **Google Service Account Keys**: Treat these with the same security as passwords
   - Rotate keys periodically (every 90 days recommended)
   - Use secrets management systems (AWS Secrets Manager, Google Secret Manager, HashiCorp Vault)
   - Monitor service account usage in Google Cloud Console
4. **CORS**: Configure `ALLOWED_ORIGINS` restrictively for production
5. **SSL/TLS**: Enable HTTPS in nginx configuration for production
6. **Rate Limiting**:
   - Nginx: 10 req/s with burst of 20 (general)
   - Export endpoint: 10 requests per hour per IP (specific to export)

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