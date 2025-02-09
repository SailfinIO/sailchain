// src/modules/nodes/nodes.service.ts

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NodesService {
  private readonly logger = new Logger(NodesService.name);
  // Using a Set to store unique node URLs
  private nodes: Set<string> = new Set();

  /**
   * Registers a new node.
   * Logs a warning if the node already exists.
   * @param nodeUrl The URL of the node to register.
   */
  addNode(nodeUrl: string): void {
    if (this.nodes.has(nodeUrl)) {
      this.logger.warn(`Node ${nodeUrl} is already registered.`);
      return;
    }
    this.nodes.add(nodeUrl);
    this.logger.log(`Node ${nodeUrl} registered successfully.`);
  }

  /**
   * Returns an array of all registered node URLs.
   */
  getNodes(): string[] {
    this.logger.log('Retrieving all registered nodes.');
    return Array.from(this.nodes);
  }

  /**
   * Removes a registered node.
   * Logs a warning if the node is not found.
   * @param nodeUrl The URL of the node to remove.
   */
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
