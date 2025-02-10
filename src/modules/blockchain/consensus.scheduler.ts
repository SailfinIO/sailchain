// src/modules/blockchain/consensus.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConsensusService } from './consensus.service';
import { NodesService } from '../nodes/nodes.service';

@Injectable()
export class ConsensusScheduler {
  private readonly logger = new Logger(ConsensusScheduler.name);

  constructor(
    private readonly consensusService: ConsensusService,
    private readonly nodesService: NodesService,
  ) {}

  // Run the consensus check every minute (you can adjust the cron expression as needed)
  @Cron('0 * * * * *') // This runs at the start of every minute
  async handleConsensus() {
    this.logger.log('Running automated consensus check...');
    // Retrieve the current list of peer nodes
    const peerNodes = this.nodesService.getNodes();

    // Trigger the consensus algorithm to sync chains
    const chainReplaced = await this.consensusService.syncChains(peerNodes);
    if (chainReplaced) {
      this.logger.log(
        'Local blockchain was replaced by a longer chain from peers.',
      );
    } else {
      this.logger.log('Local blockchain is up-to-date.');
    }
  }
}
