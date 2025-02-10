// src/app.module.ts
import { Module } from '@nestjs/common';
import { BlockChainModule } from './modules/blockchain/blockchain.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from './modules/config/config.module';
import { ConfigService } from './modules/config/config.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'global',
          limit: 20,
          ttl: 60,
        },
      ],
    }),
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
