// src/modules/nodes/nodes.controller.ts
import { Controller, Post, Get, Delete, Body, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { NodesService } from './nodes.service';
import { CreateNodeDto } from './dto/create-node.dto';

@ApiTags('Nodes')
@Controller('nodes')
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  /**
   * Register a new node.
   * Limit to 5 requests per minute.
   */
  @Throttle({
    default: { limit: 5, ttl: 60 },
  })
  @Post()
  @ApiOperation({ summary: 'Register a new node' })
  @ApiResponse({ status: 201, description: 'Node registered successfully.' })
  @ApiBody({ type: CreateNodeDto })
  registerNode(@Body() createNodeDto: CreateNodeDto) {
    this.nodesService.addNode(createNodeDto.nodeUrl);
    return {
      message: 'Node registered successfully',
      nodes: this.nodesService.getNodes(),
    };
  }

  /**
   * Retrieve all registered nodes.
   * Allow up to 20 requests per minute.
   */
  @Throttle({
    default: { limit: 20, ttl: 60 },
  })
  @Get()
  @ApiOperation({ summary: 'Retrieve all registered nodes' })
  @ApiResponse({
    status: 200,
    description: 'List of registered nodes',
    type: [String],
  })
  getNodes() {
    return this.nodesService.getNodes();
  }

  /**
   * Remove a registered node.
   * Limit to 5 requests per minute.
   */
  @Throttle({
    default: { limit: 5, ttl: 60 },
  })
  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a registered node' })
  @ApiResponse({ status: 204, description: 'Node removed successfully.' })
  @ApiBody({
    description: 'The URL of the node to remove',
    schema: {
      properties: {
        nodeUrl: { type: 'string', example: 'http://localhost:3001' },
      },
    },
  })
  removeNode(@Body('nodeUrl') nodeUrl: string) {
    this.nodesService.removeNode(nodeUrl);
  }
}
