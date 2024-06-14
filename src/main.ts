import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import * as process from 'process';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  app.useGlobalPipes(new ValidationPipe(validationOptions));
  const config = new DocumentBuilder()
    .setTitle('SPYRE CRM api documentation')
    .setDescription('documentation for SPYRE API endpoints.')
    .setVersion('1.0')
    .addTag('SPYRE')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.setGlobalPrefix('');
  await app.listen(process.env.SERVER_PORT ?? 5000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Application is running on: ${await app.getUrl()}/docs`);
}

bootstrap();
