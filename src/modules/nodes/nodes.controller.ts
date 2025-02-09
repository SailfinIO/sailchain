// src/modules/nodes/nodes.controller.ts

import { Controller, Post, Get, Delete, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { NodesService } from './nodes.service';
import { CreateNodeDto } from './dto/create-node.dto';

@ApiTags('Nodes')
@Controller('nodes')
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  /**
   * Register a new node.
   */
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
   */
  @Get()
  @ApiOperation({ summary: 'Retrieve all registered nodes' })
  @ApiResponse({
    status: 200,
    description: 'List of registered nodes',
    // The response is simply an array of strings (node URLs)
    type: [String],
  })
  getNodes() {
    return this.nodesService.getNodes();
  }

  /**
   * Remove a registered node.
   * Note: We use a DELETE request with a body containing the nodeUrl.
   */
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
