// src/app.module.ts
import { Module } from '@nestjs/common';
import { BlockChainModule } from './modules/blockchain/blockchain.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from './modules/config/config.module';
import { ConfigService } from './modules/config/config.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.appConfig.dbConnectionString,
      }),
      inject: [ConfigService],
    }),
    BlockChainModule,
    WalletModule,
    // ... any other modules
  ],
})
export class AppModule {}
