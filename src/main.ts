import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { HttpLoggingInterceptor } from './common/http-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = new Set(['http://localhost:4200', 'https://adel-alhamadani.cloud.run', process.env.FRONTEND_ORIGIN].filter(Boolean));
  app.enableCors({ origin: (origin, callback) => !origin || allowedOrigins.has(origin) ? callback(null, true) : callback(new Error('Origin not allowed')), methods: ['GET','HEAD','POST','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new HttpLoggingInterceptor());
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Journalist and Author API')
    .setDescription('Public content API for articles, books, and author updates.')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);
  await app.listen(process.env.PORT ?? 8080, '0.0.0.0');
}
bootstrap();
