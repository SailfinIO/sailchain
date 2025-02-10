// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { ConfigService } from './modules/config/config.service';
import { configureSwagger } from './modules/config/swagger.config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Block-Chain');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const PORT = configService.appConfig.port;
  const NODE_ENV = configService.appConfig.nodeEnv;

  // Swagger configuration
  const baseUrls: { [key: string]: string } = {
    production: 'https://sailfin.io',
    uat: 'https://uat.sailfin.io',
    development: 'https://dev.sailfin.io',
    local: `http://localhost:${PORT}`,
  };

  configureSwagger(app, baseUrls);

  try {
    await app.listen(PORT);
    logger.log(`Server started on port ${PORT}`);
    logger.log(`Environment: ${NODE_ENV}`);
    logger.log(`Base URL: ${baseUrls[NODE_ENV]}`);
  } catch (error) {
    logger.error('Failed to start the server', error.message);
    process.exit(1);
  }

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.log('Shutting down server...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.log('Shutting down server...');
    await app.close();
    process.exit(0);
  });
}
bootstrap();
