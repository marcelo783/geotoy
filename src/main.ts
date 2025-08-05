// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { join } from 'path';
import * as cookieParser from 'cookie-parser'; // <-- AQUI
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const dirs = ['./uploads', './tmp'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser()); // <-- AQUI (muito importante!)

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public/',
  });

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
