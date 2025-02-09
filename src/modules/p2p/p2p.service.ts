// src/modules/p2p/p2p.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';

@Injectable()
export class P2PService {
  private peers: Socket[] = [];
  private readonly logger = new Logger(P2PService.name);

  // Connect to a new peer
  connectToPeer(peerUrl: string): void {
    const socket = io(peerUrl, { reconnection: true });
    socket.on('connect', () => {
      this.logger.log(`Connected to peer: ${peerUrl}`);
      // Optionally, register this node with the peer
      socket.emit('peer:register', { url: process.env.NODE_URL });
    });
    socket.on('disconnect', () => {
      this.logger.log(`Disconnected from peer: ${peerUrl}`);
    });
    // Handle other events as needed (e.g., block propagation)
    this.peers.push(socket);
  }

  // Broadcast a new block to all connected peers
  broadcastBlock(block: any): void {
    this.peers.forEach((socket) => {
      socket.emit('block:propagate', block);
    });
  }
}
