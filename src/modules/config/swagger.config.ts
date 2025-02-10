import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const configureBaseSettings = (config: DocumentBuilder): DocumentBuilder => {
  return config
    .setTitle('Sailfin Block Chain API')
    .setDescription('API documentation for the Sailfin Block Chain API')
    .setVersion('1.0')
    .setTermsOfService(
      'https://github.com/SailfinIO/block-chain/blob/main/TERMS.md',
    )
    .setLicense(
      'Proprietary',
      'https://github.com/SailfinIO/block-chain/blob/main/LICENCE.md',
    );
};

const configureServers = (
  config: DocumentBuilder,
  baseUrls: any,
): DocumentBuilder => {
  config
    .addServer(baseUrls.production, 'US-South1-PROD Production Server')
    .addServer(baseUrls.uat, 'US-South2-NONPROD UAT')
    .addServer(baseUrls.development, 'US-South2-NONPROD Development');

  if (process.env.NODE_ENV === 'local') {
    config.addServer(baseUrls.local, 'Local Development Server');
  }

  return config;
};

const configureTags = (config: DocumentBuilder): DocumentBuilder => {
  return config
    .addTag('Blockchain', 'Endpoints related to the blockchain')
    .addTag('Health', 'Endpoints related to application health')
    .addTag('Transactions', 'Endpoints related to transactions')
    .addTag('Wallet', 'Endpoints related to wallets')
    .addTag('Nodes', 'Endpoints related to nodes');
};

const configureExternalDocs = (config: DocumentBuilder): DocumentBuilder => {
  return config.setExternalDoc(
    'GitHub Repository',
    'https://github.com/SailfinIO/block-chain',
  );
};

export const configureSwagger = (app, baseUrls): void => {
  let config = new DocumentBuilder();
  config = configureBaseSettings(config);
  config = configureServers(config, baseUrls);
  config = configureTags(config);
  config = configureExternalDocs(config);

  const document = SwaggerModule.createDocument(app, config.build());
  SwaggerModule.setup('api-docs', app, document);
};
