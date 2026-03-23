import { z } from 'zod';
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { validateSpaceConfig, getSpaceId } from '../config.js';
import { createManagementClient } from '../clients.js';

export function registerAssetTools(server: McpServer): void {
  // List assets
  server.tool(
    "list_assets",
    "List assets in the Storyblok space",
    {
      page: z.number().optional().describe("Page number (default: 1)"),
      perPage: z.number().optional().describe("Assets per page (default: 25)"),
      search: z.string().optional().describe("Search term to filter assets by filename"),
      inFolder: z.string().optional().describe("Asset folder ID to filter by"),
    },
    async ({ page, perPage, search, inFolder }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        const params: any = {
          page: page || 1,
          per_page: perPage || 25,
        };
        if (search) params.search = search;
        if (inFolder) params.in_folder = inFolder;

        const response = await client.get(`/spaces/${getSpaceId()}/assets`, { params });
        const assets = response.data.assets || [];

        if (assets.length === 0) {
          return { content: [{ type: "text" as const, text: "No assets found." }] };
        }

        const result = assets.map((a: any) =>
          `Filename: ${a.filename}\nID: ${a.id}\nTitle: ${a.title || 'N/A'}\nAlt: ${a.alt || 'N/A'}\nContent Type: ${a.content_type || 'N/A'}\nSize: ${a.content_length ? `${Math.round(a.content_length / 1024)}KB` : 'N/A'}\nCreated: ${a.created_at}`
        ).join('\n\n---\n\n');

        return { content: [{ type: "text" as const, text: result }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to list assets: ${msg}` }] };
      }
    }
  );

  // Get asset
  server.tool(
    "get_asset",
    "Get details of a specific asset",
    {
      assetId: z.string().describe("Asset ID"),
    },
    async ({ assetId }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        const response = await client.get(`/spaces/${getSpaceId()}/assets/${assetId}`);
        const a = response.data;

        const result = [
          `Filename: ${a.filename}`,
          `ID: ${a.id}`,
          `Title: ${a.title || 'N/A'}`,
          `Alt: ${a.alt || 'N/A'}`,
          `Copyright: ${a.copyright || 'N/A'}`,
          `Content Type: ${a.content_type || 'N/A'}`,
          `Size: ${a.content_length ? `${Math.round(a.content_length / 1024)}KB` : 'N/A'}`,
          `Focus: ${a.focus || 'N/A'}`,
          `Folder ID: ${a.asset_folder_id || 'root'}`,
          `Created: ${a.created_at}`,
          `Updated: ${a.updated_at || 'N/A'}`,
        ].join('\n');

        return { content: [{ type: "text" as const, text: result }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to get asset: ${msg}` }] };
      }
    }
  );

  // Delete asset
  server.tool(
    "delete_asset",
    "Delete an asset from the Storyblok space",
    {
      assetId: z.string().describe("Asset ID to delete"),
    },
    async ({ assetId }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        await client.delete(`/spaces/${getSpaceId()}/assets/${assetId}`);
        return { content: [{ type: "text" as const, text: `Asset ${assetId} deleted successfully.` }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to delete asset: ${msg}` }] };
      }
    }
  );

  // List asset folders
  server.tool(
    "list_asset_folders",
    "List asset folders in the Storyblok space",
    {},
    async () => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        const response = await client.get(`/spaces/${getSpaceId()}/asset_folders`);
        const folders = response.data.asset_folders || [];

        if (folders.length === 0) {
          return { content: [{ type: "text" as const, text: "No asset folders found." }] };
        }

        const result = folders.map((f: any) =>
          `Name: ${f.name}\nID: ${f.id}\nParent ID: ${f.parent_id || 'root'}`
        ).join('\n\n---\n\n');

        return { content: [{ type: "text" as const, text: result }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to list asset folders: ${msg}` }] };
      }
    }
  );
}
