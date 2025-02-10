import * as Joi from 'joi';

export const APP_CONFIG = {
  DB_CONNECTION_STRING: 'DB_CONNECTION_STRING',
  NODE_URL: 'NODE_URL',
  ENCRYPTION_KEY: 'ENCRYPTION_KEY',
  MINER_ADDRESS: 'MINER_ADDRESS',
  GENESIS_WALLET_ADDRESS: 'GENESIS_WALLET_ADDRESS',
  INITIAL_COINBASE_REWARD: 'INITIAL_COINBASE_REWARD',
  PORT: 'PORT',
  NODE_ENV: 'NODE_ENV',
};

export interface AppConfig {
  dbConnectionString: string;
  nodeUrl: string;
  encryptionKey: string;
  minerAddress: string;
  genesisWalletAddress: string;
  initialCoinbaseReward: number;
  port: number;
  nodeEnv: string;
}

const appValidation: Record<string, Joi.SchemaLike> = {
  [APP_CONFIG.DB_CONNECTION_STRING]: Joi.string().required(),
  [APP_CONFIG.NODE_URL]: Joi.string().required(),
  [APP_CONFIG.ENCRYPTION_KEY]: Joi.string().required(),
  [APP_CONFIG.MINER_ADDRESS]: Joi.string().optional(),
  [APP_CONFIG.GENESIS_WALLET_ADDRESS]: Joi.string().optional(),
  [APP_CONFIG.INITIAL_COINBASE_REWARD]: Joi.number().optional(),
  [APP_CONFIG.PORT]: Joi.number().optional(),
  [APP_CONFIG.NODE_ENV]: Joi.string().required(),
};

export const appValidationSchema = Joi.object(appValidation);
