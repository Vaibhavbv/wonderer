import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '*');
  // The `cors` package treats a string '*' as "allow all", but an array containing
  // the literal string '*' as a one-item allowlist that never matches a real Origin
  // header. With credentials: true that combo silently breaks every cross-origin
  // request, so wildcard mode must stay a value the package reflects per-request.
  const allowedOrigins = corsOrigins === '*' ? true : corsOrigins.split(',');

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
  }));
  app.use(compression());
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global pipes
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // Global interceptors & filters
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // OpenAPI / Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Wanderverse API')
    .setDescription('Premium Travel Memory Platform API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication & User Management')
    .addTag('Trips', 'Trip Management')
    .addTag('Media', 'Photo & Video Upload')
    .addTag('Stories', 'Story Editor & Layout')
    .addTag('AI', 'AI Content Generation')
    .addTag('Maps', 'Map & Geodata')
    .addTag('Social', 'Comments, Likes, Follows')
    .addTag('Payments', 'Subscriptions & Billing')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('v1/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Wanderverse API running on http://localhost:${port}`);
  console.log(`📚 API Docs available at http://localhost:${port}/v1/docs`);
  console.log(`🔧 Environment: ${nodeEnv}`);
}

bootstrap();
