// src/modules/p2p/p2p.gateway.ts
import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class P2PGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(P2PGateway.name);

  afterInit(server: Server) {
    this.logger.log('P2P Gateway initialized');
  }

  // This handler receives block propagation events from peers
  @SubscribeMessage('block:propagate')
  handleBlockPropagation(client: Socket, payload: any): void {
    this.logger.log(`Received block from peer: ${JSON.stringify(payload)}`);
    // You can forward this to your blockchain service for validation and addition
    // e.g., this.blockchainService.receiveBlock(payload);
  }

  // Optionally, handle peer registration, heartbeat, etc.
  @SubscribeMessage('peer:register')
  handlePeerRegistration(client: Socket, payload: any): void {
    this.logger.log(
      `Peer registered: ${client.id} - ${JSON.stringify(payload)}`,
    );
    // You might store connected peer info here
  }
}
