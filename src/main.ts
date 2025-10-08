import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
const passport = require('passport'); // ✅ CommonJS import
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const dirs = ['./uploads', './tmp'];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ✅ Inicializa o Passport corretamente
  app.use(passport.initialize());

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });
  app.useStaticAssets(join(__dirname, '..', 'public'), { prefix: '/public/' });

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  await app.listen(3000);
  console.log('🚀 Server running at http://localhost:3000');
}
bootstrap();
