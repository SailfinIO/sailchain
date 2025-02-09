// src/modules/wallet/wallet.controller.ts
import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('generate')
  generateWallet() {
    return this.walletService.generateWallet();
  }

  @Get('balance')
  getBalance(@Query('address') address: string) {
    if (!address) {
      throw new BadRequestException('Address is required');
    }
    const balance = this.walletService.getBalance(address);
    return { address, balance };
  }
}
