// src/modules/blockchain/consensus.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { BlockchainService } from './blockchain.service';
import { Block } from './classes/Block';

@Injectable()
export class ConsensusService {
  private readonly logger = new Logger(ConsensusService.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Compare with nodes and replace our chain if a longer, valid chain is found.
   * This function can be called both on a schedule and immediately upon receiving a new block.
   */
  async syncChains(peerNodes: string[]): Promise<boolean> {
    const localChain = this.blockchainService.getChain();
    let localWork = this.calculateCumulativeDifficulty(localChain);
    let bestChain = localChain;

    for (const nodeUrl of peerNodes) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(`${nodeUrl}/blockchain`),
        );
        const peerChain: Block<any>[] = response.data;
        const peerWork = this.calculateCumulativeDifficulty(peerChain);
        // If the peer chain has more cumulative work and is valid, consider replacing ours
        if (
          peerWork > localWork &&
          this.blockchainService.isChainValid(peerChain)
        ) {
          bestChain = peerChain;
          localWork = peerWork;
        }
      } catch (err) {
        this.logger.error(`Error fetching chain from ${nodeUrl}`, err);
      }
    }

    if (bestChain.length > localChain.length) {
      this.logger.log('A better chain was found. Replacing local chain.');
      return await this.blockchainService.replaceChain(bestChain);
    }
    return false;
  }

  private calculateCumulativeDifficulty(chain: Block<any>[]): number {
    return chain.reduce((total, block) => total + block.difficulty, 0);
  }
}
