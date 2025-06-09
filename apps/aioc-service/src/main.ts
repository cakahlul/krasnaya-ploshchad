import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FirebaseAuthGuard } from './auth/firebase-auth.guard';
import { INestApplication } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Express } from 'express';
import { Server } from 'http';

interface RouteLayer {
  route?: {
    path: string;
    methods: Record<string, boolean>;
  };
}

interface ExpressServer extends Server {
  _events?: {
    request?: {
      _router?: {
        stack?: RouteLayer[];
      };
    };
  };
}

let app: INestApplication;

async function bootstrap() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  app = await NestFactory.create(AppModule);

  // Remove global prefix since Vercel handles it
  // app.setGlobalPrefix('api', {
  //   exclude: ['/health'],
  // });

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
    const server = app.getHttpServer() as ExpressServer;
    const router = server._events?.request?._router;
    if (router?.stack) {
      const availableRoutes = router.stack
        .map(layer => {
          if (layer.route) {
            const path = layer.route.path;
            const method = Object.keys(layer.route.methods)[0].toUpperCase();
            return `${method} ${path}`;
          }
          return undefined;
        })
        .filter((item): item is string => item !== undefined);

      console.log('Registered routes:', availableRoutes);
    }
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
  // Normalize the request path
  const originalUrl = req.originalUrl || req.url;
  const path = originalUrl.split('?')[0];

  // Remove /api prefix from the path for NestJS routing
  const nestPath = path.startsWith('/api') ? path.substring(4) : path;

  console.log('Incoming request:', {
    method: req.method,
    originalUrl,
    path,
    nestPath,
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

    // Create a new request object
    const modifiedReq = {
      ...req,
      url: path,
      originalUrl: path,
      baseUrl: '',
      path: path,
    } as Request;

    // Handle the request
    const handleRequest = () => {
      return new Promise<void>((resolve, reject) => {
        expressApp(modifiedReq, res, ((err: unknown) => {
          if (err) {
            console.error('Error handling request:', err);
            res.status(500).json({
              error: 'Internal Server Error',
              details: err instanceof Error ? err.message : String(err),
              path,
            });
          }
          resolve();
        }) as NextFunction);
      });
    };

    await handleRequest();
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error',
      path,
    });
  }
};

// For local development
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}

// Export the handler as default for Vercel
export default handler;
