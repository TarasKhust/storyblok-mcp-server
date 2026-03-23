import { z } from 'zod';
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { validateSpaceConfig, getSpaceId } from '../config.js';
import { createManagementClient } from '../clients.js';

export function registerDatasourceTools(server: McpServer): void {
  // List datasources
  server.tool(
    "list_datasources",
    "List all datasources in the Storyblok space. Datasources are key-value collections used for dropdowns, tags, etc.",
    {},
    async () => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        const response = await client.get(`/spaces/${getSpaceId()}/datasources`);
        const datasources = response.data.datasources || [];

        if (datasources.length === 0) {
          return { content: [{ type: "text" as const, text: "No datasources found." }] };
        }

        const result = datasources.map((ds: any) =>
          `Name: ${ds.name}\nSlug: ${ds.slug}\nID: ${ds.id}\nDimensions: ${(ds.dimensions || []).map((d: any) => d.name).join(', ') || 'none'}`
        ).join('\n\n---\n\n');

        return { content: [{ type: "text" as const, text: result }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to list datasources: ${msg}` }] };
      }
    }
  );

  // Get datasource entries
  server.tool(
    "get_datasource_entries",
    "Get all entries (key-value pairs) of a specific datasource",
    {
      datasourceId: z.string().describe("Datasource ID"),
      page: z.number().optional().describe("Page number (default: 1)"),
      perPage: z.number().optional().describe("Entries per page (default: 25)"),
    },
    async ({ datasourceId, page, perPage }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        const response = await client.get(`/spaces/${getSpaceId()}/datasource_entries`, {
          params: {
            datasource_id: datasourceId,
            page: page || 1,
            per_page: perPage || 25,
          },
        });
        const entries = response.data.datasource_entries || [];

        if (entries.length === 0) {
          return { content: [{ type: "text" as const, text: "No entries found in this datasource." }] };
        }

        const result = entries.map((e: any) =>
          `Name: ${e.name}\nValue: ${e.value}\nID: ${e.id}`
        ).join('\n\n---\n\n');

        return { content: [{ type: "text" as const, text: result }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to get datasource entries: ${msg}` }] };
      }
    }
  );

  // Create datasource
  server.tool(
    "create_datasource",
    "Create a new datasource",
    {
      name: z.string().describe("Name of the datasource"),
      slug: z.string().optional().describe("Slug (auto-generated from name if not provided)"),
    },
    async ({ name, slug }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        const body: any = { datasource: { name } };
        if (slug) body.datasource.slug = slug;

        const response = await client.post(`/spaces/${getSpaceId()}/datasources`, body);
        const ds = response.data.datasource;

        return { content: [{ type: "text" as const, text: `Datasource created!\n\nName: ${ds.name}\nSlug: ${ds.slug}\nID: ${ds.id}` }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to create datasource: ${msg}` }] };
      }
    }
  );

  // Create datasource entry
  server.tool(
    "create_datasource_entry",
    "Add a new entry (key-value pair) to a datasource",
    {
      datasourceId: z.string().describe("Datasource ID"),
      name: z.string().describe("Display name of the entry"),
      value: z.string().describe("Value of the entry"),
    },
    async ({ datasourceId, name, value }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        const response = await client.post(`/spaces/${getSpaceId()}/datasource_entries`, {
          datasource_entry: {
            name,
            value,
            datasource_id: datasourceId,
          },
        });
        const e = response.data.datasource_entry;

        return { content: [{ type: "text" as const, text: `Entry created!\n\nName: ${e.name}\nValue: ${e.value}\nID: ${e.id}` }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to create datasource entry: ${msg}` }] };
      }
    }
  );

  // Delete datasource
  server.tool(
    "delete_datasource",
    "Delete a datasource and all its entries",
    {
      datasourceId: z.string().describe("Datasource ID to delete"),
    },
    async ({ datasourceId }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        await client.delete(`/spaces/${getSpaceId()}/datasources/${datasourceId}`);
        return { content: [{ type: "text" as const, text: `Datasource ${datasourceId} deleted successfully.` }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to delete datasource: ${msg}` }] };
      }
    }
  );
}
