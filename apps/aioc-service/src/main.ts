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
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: allowedOrigins ? allowedOrigins.split(',') : '*', // Allow all origins if ALLOWED_ORIGINS is not set
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
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
  if (!app) {
    app = await bootstrap();
  }
  const expressApp = app.getHttpAdapter().getInstance() as Express;
  expressApp(req, res);
};

// For local development
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}

// Export the handler as default for Vercel
export default handler;
