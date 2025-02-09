import * as Joi from 'joi';

export const APP_CONFIG = {
  DB_CONNECTION_STRING: 'DB_CONNECTION_STRING',
};

export interface AppConfig {
  dbConnectionString: string;
}

const appValidation: Record<string, Joi.SchemaLike> = {
  [APP_CONFIG.DB_CONNECTION_STRING]: Joi.string().required(),
};

export const appValidationSchema = Joi.object(appValidation);
