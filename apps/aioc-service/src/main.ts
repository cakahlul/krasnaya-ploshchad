import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FirebaseAuthGuard } from './auth/firebase-auth.guard';
import { INestApplication } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Express } from 'express';

let app: INestApplication;

async function bootstrap() {
  if (app) {
    return app;
  }

  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
    bodyParser: true,
  });

  app.enableCors({
    origin: allowedOrigins ? allowedOrigins.split(',') : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders:
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  });
  app.useGlobalGuards(new FirebaseAuthGuard());

  // Log all registered routes
  try {
    // Note: Route logging is simplified for production compatibility
    console.log('Application routes registered successfully');
  } catch (error) {
    console.warn('Could not log registered routes:', error);
  }

  if (process.env.NODE_ENV !== 'production') {
    await app.listen(process.env.PORT ?? 3001);
    console.log(`Application is running on: ${await app.getUrl()}`);
  }

  return app;
}

// For Vercel serverless deployment
const handler = async (req: Request, res: Response): Promise<void> => {
  // Handle OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle health check
  if (req.url === '/health') {
    res.status(200).json({ status: 'ok' });
    return;
  }

  try {
    const app = await bootstrap();
    const expressApp = app.getHttpAdapter().getInstance() as Express;

    // Create a new request object
    const modifiedReq = {
      ...req,
      url: req.url.replace(/^\/api/, ''),
      originalUrl: req.originalUrl.replace(/^\/api/, ''),
      baseUrl: '',
      path: req.path.replace(/^\/api/, ''),
    } as Request;

    // Handle the request with timeout
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 50000);
    });

    const handleRequest = new Promise<void>((resolve) => {
      expressApp(modifiedReq, res, ((err: unknown) => {
        if (err) {
          console.error('Error handling request:', err);
          const errorMessage =
            err instanceof Error ? err.message : 'Unknown error';
          res.status(500).json({
            error: 'Internal Server Error',
            details: errorMessage,
          });
        }
        resolve();
      }) as NextFunction);
    });

    await Promise.race([handleRequest, timeout]);
  } catch (error) {
    console.error('Error handling request:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Internal Server Error',
      details: errorMessage,
    });
  }
};

// For local development
if (process.env.NODE_ENV !== 'production') {
  void bootstrap();
}

// Export the handler as default for Vercel
export default handler;
