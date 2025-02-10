import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { AppConfig, APP_CONFIG } from './app.config';

@Injectable()
export class ConfigService {
  constructor(private nestConfigService: NestConfigService) {}

  get appConfig(): AppConfig {
    return {
      dbConnectionString: this.nestConfigService.get(
        APP_CONFIG.DB_CONNECTION_STRING,
      ),
      nodeUrl: this.nestConfigService.get(APP_CONFIG.NODE_URL),
      encryptionKey: this.nestConfigService.get(APP_CONFIG.ENCRYPTION_KEY),
      minerAddress: this.nestConfigService.get(APP_CONFIG.MINER_ADDRESS),
      genesisWalletAddress: this.nestConfigService.get(
        APP_CONFIG.GENESIS_WALLET_ADDRESS,
      ),
      initialCoinbaseReward: this.nestConfigService.get(
        APP_CONFIG.INITIAL_COINBASE_REWARD,
      ),
      port: this.nestConfigService.get(APP_CONFIG.PORT),
      nodeEnv: this.nestConfigService.get(APP_CONFIG.NODE_ENV),
    };
  }
}
