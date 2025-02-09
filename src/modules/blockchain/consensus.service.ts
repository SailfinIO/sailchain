// src/modules/blockchain/consensus.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { BlockchainService } from './blockchain.service';

@Injectable()
export class ConsensusService {
  private readonly logger = new Logger(ConsensusService.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Compare with nodes and replace our chain if a longer, valid chain is found.
   */
  async syncChains(peerNodes: string[]): Promise<boolean> {
    let longestChain = this.blockchainService.getChain();

    for (const nodeUrl of peerNodes) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(`${nodeUrl}/blockchain`),
        );
        const peerChain = response.data;
        // If peer’s chain is longer and valid, adopt it.
        if (
          peerChain.length > longestChain.length &&
          this.blockchainService.isChainValid(peerChain)
        ) {
          longestChain = peerChain;
        }
      } catch (err) {
        this.logger.error(`Error fetching chain from ${nodeUrl}`, err);
      }
    }

    // If we found a longer chain, replace ours.
    if (longestChain.length > this.blockchainService.getChain().length) {
      return await this.blockchainService.replaceChain(longestChain);
    }
    return false;
  }
}
