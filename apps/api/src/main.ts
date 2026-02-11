import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { jwtConfig } from './common/config/jwt.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors();

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  const isDev = process.env.NODE_ENV !== 'production';
  const config = new DocumentBuilder()
    .setTitle('ZuriDrop API')
    .setDescription(
      'API de la plateforme ZuriDrop – Livraison & Gestion Marchande\n\n' +
      (isDev
        ? '⚡ **Mode DEV** – Access token valide **' + jwtConfig.accessTokenTtl() + '** pour un test Swagger confortable.\n\n' +
          '1. Appelez `POST /auth/login`\n' +
          '2. Copiez le `accessToken` de la réponse\n' +
          '3. Cliquez sur **Authorize** 🔒 et collez le token\n' +
          '4. Toutes vos requêtes seront authentifiées'
        : ''),
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Health', 'Vérification de santé de l\'API')
    .addTag('Auth', 'Authentification (register, login, refresh, logout)')
    .addTag('Users', 'Gestion des utilisateurs et adresses')
    .addTag('Restaurants', 'Restaurants et menu items')
    .addTag('Discovery', 'Recherche de plats – découverte client')
    .addTag('Orders', 'Commandes')
    .addTag('Merchant Orders', 'Dashboard merchant – commandes entrantes, préparation, actions')
    .addTag('Delivery', 'Livraisons et drivers')
    .addTag('Promotions', 'Codes promotionnels')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 ZuriDrop API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  jwtConfig.logConfig();
}

bootstrap();
