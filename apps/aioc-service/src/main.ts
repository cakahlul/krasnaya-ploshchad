import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FirebaseAuthGuard } from './auth/firebase-auth.guard';
import { INestApplication } from '@nestjs/common';
import { Request, Response } from 'express';
import { Express } from 'express';

let app: INestApplication;

async function bootstrap() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  app = await NestFactory.create(AppModule);

  // Set global prefix for all routes
  app.setGlobalPrefix('api', {
    exclude: ['/health'],
  });

  app.enableCors({
    origin: allowedOrigins ? allowedOrigins.split(',') : '*', // Allow all origins if ALLOWED_ORIGINS is not set
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // Allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    allowedHeaders:
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  });
  app.useGlobalGuards(new FirebaseAuthGuard());

  if (process.env.NODE_ENV !== 'production') {
    await app.listen(process.env.PORT ?? 3001);
    console.log(`Application is running on: ${await app.getUrl()}`);
  }

  return app;
}

// For Vercel serverless deployment
const handler = async (req: Request, res: Response): Promise<void> => {
  // Normalize the request path
  const originalUrl = req.originalUrl || req.url;
  const path = originalUrl.split('?')[0];

  console.log('Incoming request:', {
    method: req.method,
    originalUrl,
    path,
    query: req.query,
    headers: {
      host: req.headers.host,
      'x-forwarded-host': req.headers['x-forwarded-host'],
      'x-forwarded-proto': req.headers['x-forwarded-proto'],
    },
  });

  if (!app) {
    console.log('Initializing app...');
    app = await bootstrap();
    console.log('App initialized');
  }

  const expressApp = app.getHttpAdapter().getInstance() as Express;

  // Add error handling
  try {
    // Handle OPTIONS requests for CORS
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Handle health check
    if (path === '/health') {
      res.status(200).json({ status: 'ok' });
      return;
    }

    expressApp(req, res);
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error',
      path,
      originalUrl,
    });
  }
};

// For local development
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}

// Export the handler as default for Vercel
export default handler;
