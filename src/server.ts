#!/usr/bin/env node

import './config.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerSpaceTools } from './tools/spaces.js';
import { registerComponentTools } from './tools/components.js';
import { registerStoryTools } from './tools/stories.js';
import { registerAssetTools } from './tools/assets.js';
import { registerDatasourceTools } from './tools/datasources.js';

const server = new McpServer({
  name: "storyblok",
  version: "0.1.0",
});

// Register all tool groups
registerSpaceTools(server);         // 2 tools: list_spaces, get_space
registerComponentTools(server);     // 7 tools: list/get/create/update/delete components, list/create component groups
registerStoryTools(server);         // 7 tools: list/get/create/update/delete/publish/unpublish stories
registerAssetTools(server);         // 4 tools: list/get/delete assets, list asset folders
registerDatasourceTools(server);    // 5 tools: list/get_entries/create/create_entry/delete datasources

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Validate configuration on startup
  if (!process.env.STORYBLOK_PERSONAL_ACCESS_TOKEN) {
    console.error('Warning: STORYBLOK_PERSONAL_ACCESS_TOKEN is not set. Tools will return configuration errors.');
  }
  if (!process.env.STORYBLOK_SPACE_ID) {
    console.error('Warning: STORYBLOK_SPACE_ID is not set. Space-specific tools will require it.');
  }
}

main().catch((error) => {
  console.error('Failed to start Storyblok MCP server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await server.close();
  process.exit(0);
});
