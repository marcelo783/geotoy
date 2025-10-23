import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import * as passport from 'passport';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // 🔹 Garante pastas locais
  const dirs = ['./uploads', './tmp'];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 🔹 Middleware globais
  app.use(passport.initialize());
  app.use(cookieParser());

  // 🔹 Pipes de validação globais
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // 🔹 Servir arquivos estáticos
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });
  app.useStaticAssets(join(__dirname, '..', 'public'), { prefix: '/public/' });

  // 🔹 Configuração de CORS dinâmica
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.enableCors({
  origin: [
    "http://localhost:5173",  // Dev normal
    "http://localhost:4173",  // Dev com npm run preview
    "https://geotoy.vercel.app", // Produção
  ],
  credentials: true,
});

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running at ${await app.getUrl()}`);
  console.log(`✅ CORS liberado para: ${frontendUrl}`);
}
bootstrap();
