import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FirebaseAuthGuard } from './auth/firebase-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalGuards(new FirebaseAuthGuard());
  await app.listen(process.env.PORT ?? 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
