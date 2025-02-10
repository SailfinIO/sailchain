// src/modules/p2p/p2p.gateway.ts

import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { BlockchainService } from '../blockchain/blockchain.service';
import { NodesService } from '../nodes/nodes.service';
import { ConsensusService } from '../blockchain/consensus.service';

@WebSocketGateway({ cors: true })
export class P2PGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(P2PGateway.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly nodesService: NodesService,
    private readonly consensusService: ConsensusService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('P2P Gateway initialized');
  }

  // When a block is propagated from a peer, process it and trigger consensus
  @SubscribeMessage('block:propagate')
  async handleBlockPropagation(client: Socket, payload: any): Promise<void> {
    this.logger.log(`Received block from peer: ${JSON.stringify(payload)}`);

    try {
      // Process the received block
      const result = await this.blockchainService.receiveBlock(payload);
      this.logger.log(`Block processed: ${JSON.stringify(result)}`);

      // Immediately trigger consensus to check if our chain should update
      const peerNodes = this.nodesService.getNodes();
      await this.consensusService.syncChains(peerNodes);
    } catch (error) {
      this.logger.error('Error processing propagated block', error);
    }
  }

  @SubscribeMessage('peer:register')
  async handlePeerRegistration(client: Socket, payload: any): Promise<void> {
    this.logger.log(
      `Peer registered: ${client.id} - ${JSON.stringify(payload)}`,
    );
    // Optionally, trigger an immediate consensus check
    const peerNodes = this.nodesService.getNodes();
    await this.consensusService.syncChains(peerNodes);
  }
}
