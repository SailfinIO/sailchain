// src/modules/p2p/p2p.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';

@Injectable()
export class P2PService {
  // Use a Map to keep track of peers by URL
  private peers: Map<string, Socket> = new Map();
  private readonly logger = new Logger(P2PService.name);

  /**
   * Connect to a new peer. If already connected, ignore.
   */
  connectToPeer(peerUrl: string): void {
    if (this.peers.has(peerUrl)) {
      this.logger.warn(`Already connected to peer: ${peerUrl}`);
      return;
    }

    const socket = io(peerUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      this.logger.log(`Connected to peer: ${peerUrl}`);
      // Optionally, register with the peer on connection
      socket.emit('peer:register', { url: process.env.NODE_URL });
      // Save the peer once connected
      this.peers.set(peerUrl, socket);
    });

    socket.on('disconnect', () => {
      this.logger.log(`Disconnected from peer: ${peerUrl}`);
      // Remove the peer from our Map on disconnect
      this.peers.delete(peerUrl);
    });

    socket.on('connect_error', (error: any) => {
      this.logger.error(`Error connecting to peer: ${peerUrl}`, error);
    });

    socket.on('reconnect_attempt', (attempt: number) => {
      this.logger.log(`Reconnection attempt ${attempt} to peer: ${peerUrl}`);
    });
  }

  /**
   * Broadcast a new block to all connected peers.
   */
  broadcastBlock(block: any): void {
    this.peers.forEach((socket, peerUrl) => {
      socket.emit('block:propagate', block);
      this.logger.log(`Broadcasting block ${block.hash} to ${peerUrl}`);
    });
  }

  /**
   * Optionally, broadcast a consensus request to all peers.
   */
  broadcastConsensusRequest(): void {
    this.peers.forEach((socket, peerUrl) => {
      socket.emit('consensus:request', { from: process.env.NODE_URL });
    });
  }

  /**
   * Get a list of active peer URLs.
   */
  getActivePeerUrls(): string[] {
    return Array.from(this.peers.keys());
  }
}
