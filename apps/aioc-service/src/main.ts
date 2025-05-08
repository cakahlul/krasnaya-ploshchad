import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FirebaseAuthGuard } from './auth/firebase-auth.guard';

async function bootstrap() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: allowedOrigins ? allowedOrigins.split(',') : '*', // Allow all origins if ALLOWED_ORIGINS is not set
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  });
  app.useGlobalGuards(new FirebaseAuthGuard());
  await app.listen(process.env.PORT ?? 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
