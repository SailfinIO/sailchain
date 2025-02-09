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
    };
  }
}
