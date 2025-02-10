// src/modules/wallet/wallet.controller.ts
import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WalletService } from './wallet.service';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  /**
   * Generate a new wallet (public/private key pair).
   * Limit to 5 requests per minute.
   */
  @Throttle({
    default: { limit: 5, ttl: 60 },
  })
  @Get('generate')
  @ApiOperation({ summary: 'Generate a new wallet (public/private key pair)' })
  @ApiResponse({
    status: 201,
    description: 'New wallet generated',
  })
  generateWallet() {
    return this.walletService.generateWallet();
  }

  /**
   * Get the balance for a wallet address.
   * Allow up to 20 requests per minute.
   */
  @Throttle({
    default: { limit: 20, ttl: 60 },
  })
  @Get('balance')
  @ApiOperation({ summary: 'Get the balance for a wallet address' })
  @ApiResponse({
    status: 200,
    description: 'The balance for the specified wallet address',
  })
  @ApiResponse({ status: 400, description: 'Invalid wallet address format' })
  getBalance(@Query('address') address: string) {
    if (!address) {
      throw new BadRequestException('Address is required');
    }
    if (!this.walletService.isValidAddress(address)) {
      throw new BadRequestException('Invalid wallet address format');
    }
    const balance = this.walletService.getBalance(address);
    return { address, balance };
  }
}
