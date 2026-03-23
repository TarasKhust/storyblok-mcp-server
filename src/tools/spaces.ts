import { z } from 'zod';
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { validateConfig } from '../config.js';
import { createManagementClient } from '../clients.js';

export function registerSpaceTools(server: McpServer): void {
  // List all spaces
  server.tool(
    "list_spaces",
    "List all Storyblok spaces accessible with the current token",
    {},
    async () => {
      const configError = validateConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        const response = await client.get('/spaces');
        const spaces = response.data.spaces || [];

        if (spaces.length === 0) {
          return { content: [{ type: "text" as const, text: "No spaces found." }] };
        }

        const result = spaces.map((space: any) =>
          `ID: ${space.id}\nName: ${space.name}\nDomain: ${space.domain || 'N/A'}\nPlan: ${space.plan || 'N/A'}\nCreated: ${space.created_at}\n`
        ).join('\n---\n');

        return { content: [{ type: "text" as const, text: result }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to list spaces: ${msg}` }] };
      }
    }
  );

  // Get space details
  server.tool(
    "get_space",
    "Get details of a specific Storyblok space",
    {
      spaceId: z.string().optional().describe("Space ID. Uses STORYBLOK_SPACE_ID env var if not provided"),
    },
    async ({ spaceId }) => {
      const configError = validateConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      const resolvedSpaceId = spaceId || process.env.STORYBLOK_SPACE_ID;
      if (!resolvedSpaceId) {
        return { content: [{ type: "text" as const, text: "No space ID provided. Pass spaceId or set STORYBLOK_SPACE_ID env var." }] };
      }

      try {
        const client = createManagementClient();
        const response = await client.get(`/spaces/${resolvedSpaceId}`);
        const space = response.data.space;

        const result = [
          `ID: ${space.id}`,
          `Name: ${space.name}`,
          `Domain: ${space.domain || 'N/A'}`,
          `Plan: ${space.plan || 'N/A'}`,
          `Plan Level: ${space.plan_level || 'N/A'}`,
          `Owner ID: ${space.owner_id || 'N/A'}`,
          `Default Language: ${space.default_lang || 'default'}`,
          `Languages: ${(space.languages || []).map((l: any) => l.code).join(', ') || 'none'}`,
          `Created: ${space.created_at}`,
          `Updated: ${space.updated_at}`,
        ].join('\n');

        return { content: [{ type: "text" as const, text: result }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to get space: ${msg}` }] };
      }
    }
  );
}
