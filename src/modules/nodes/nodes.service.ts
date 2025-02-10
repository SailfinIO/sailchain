// src/modules/nodes/nodes.service.ts

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NodesService {
  private readonly logger = new Logger(NodesService.name);
  // Load bootstrap peers from environment, if available
  private nodes: Set<string> = new Set(
    process.env.BOOTSTRAP_PEERS ? process.env.BOOTSTRAP_PEERS.split(',') : [],
  );

  addNode(nodeUrl: string): void {
    if (this.nodes.has(nodeUrl)) {
      this.logger.warn(`Node ${nodeUrl} is already registered.`);
      return;
    }
    this.nodes.add(nodeUrl);
    this.logger.log(`Node ${nodeUrl} registered successfully.`);
  }

  getNodes(): string[] {
    this.logger.log('Retrieving all registered nodes.');
    return Array.from(this.nodes);
  }

  removeNode(nodeUrl: string): void {
    if (!this.nodes.has(nodeUrl)) {
      this.logger.warn(
        `Attempted to remove node ${nodeUrl}, but it was not found.`,
      );
      return;
    }
    this.nodes.delete(nodeUrl);
    this.logger.log(`Node ${nodeUrl} removed successfully.`);
  }
}
