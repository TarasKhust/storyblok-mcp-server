import { z } from 'zod';
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { validateSpaceConfig, getSpaceId } from '../config.js';
import { createManagementClient } from '../clients.js';

export function registerStoryTools(server: McpServer): void {
  // List stories
  server.tool(
    "list_stories",
    "List stories in the Storyblok space with optional filtering",
    {
      page: z.number().optional().describe("Page number (default: 1)"),
      perPage: z.number().optional().describe("Stories per page (default: 25, max: 100)"),
      startsWith: z.string().optional().describe("Filter by slug prefix (e.g. 'blog/' for all blog stories)"),
      searchTerm: z.string().optional().describe("Search term to filter stories by name"),
      sortBy: z.string().optional().describe("Sort field (e.g. 'name:asc', 'created_at:desc', 'updated_at:desc')"),
      withParent: z.string().optional().describe("Filter by parent folder ID"),
      isFolder: z.boolean().optional().describe("Filter for folders only (true) or stories only (false)"),
      contentType: z.string().optional().describe("Filter by component name (content type)"),
    },
    async ({ page, perPage, startsWith, searchTerm, sortBy, withParent, isFolder, contentType }) => {
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
        if (startsWith) params.starts_with = startsWith;
        if (searchTerm) params.search_term = searchTerm;
        if (sortBy) params.sort_by = sortBy;
        if (withParent) params.with_parent = withParent;
        if (isFolder !== undefined) params.is_folder = isFolder;
        if (contentType) params.content_type = contentType;

        const response = await client.get(`/spaces/${getSpaceId()}/stories`, { params });
        const stories = response.data.stories || [];
        const total = response.headers['total'] || stories.length;

        if (stories.length === 0) {
          return { content: [{ type: "text" as const, text: "No stories found." }] };
        }

        const result = `Total: ${total}\nPage: ${params.page}\n\n` + stories.map((s: any) =>
          `Name: ${s.name}\nSlug: ${s.full_slug}\nID: ${s.id}\nUUID: ${s.uuid}\nComponent: ${s.content?.component || 'N/A'}\nIs Folder: ${s.is_folder || false}\nPublished: ${s.published ? 'Yes' : 'No'}\nCreated: ${s.created_at}\nUpdated: ${s.updated_at || 'N/A'}`
        ).join('\n\n---\n\n');

        return { content: [{ type: "text" as const, text: result }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to list stories: ${msg}` }] };
      }
    }
  );

  // Get story
  server.tool(
    "get_story",
    "Get a specific story with its full content",
    {
      storyId: z.string().describe("Story ID or full slug (e.g. '12345' or 'blog/my-post')"),
    },
    async ({ storyId }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        const response = await client.get(`/spaces/${getSpaceId()}/stories/${storyId}`);
        const s = response.data.story;

        const contentStr = JSON.stringify(s.content, null, 2);

        const result = [
          `Name: ${s.name}`,
          `Slug: ${s.full_slug}`,
          `ID: ${s.id}`,
          `UUID: ${s.uuid}`,
          `Component: ${s.content?.component || 'N/A'}`,
          `Is Folder: ${s.is_folder || false}`,
          `Parent ID: ${s.parent_id || 'none'}`,
          `Published: ${s.published ? 'Yes' : 'No'}`,
          `First Published: ${s.first_published_at || 'never'}`,
          `Created: ${s.created_at}`,
          `Updated: ${s.updated_at || 'N/A'}`,
          `Position: ${s.position || 0}`,
          `\nContent:\n${contentStr}`,
        ].join('\n');

        return { content: [{ type: "text" as const, text: result }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to get story: ${msg}` }] };
      }
    }
  );

  // Create story
  server.tool(
    "create_story",
    "Create a new story (content entry) in the Storyblok space",
    {
      name: z.string().describe("Name of the story"),
      slug: z.string().optional().describe("URL slug (auto-generated from name if not provided)"),
      content: z.string().describe("JSON string of the story content. Must include 'component' field matching a component name. Example: {\"component\":\"page\",\"title\":\"Hello\",\"body\":[]}"),
      parentId: z.string().optional().describe("Parent folder ID to create the story in"),
      isFolder: z.boolean().optional().describe("Create as folder (true) or story (false). Default: false"),
      publish: z.boolean().optional().describe("Publish immediately after creation. Default: false"),
    },
    async ({ name, slug, content, parentId, isFolder, publish }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      let parsedContent: Record<string, any>;
      try {
        parsedContent = JSON.parse(content);
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Invalid content JSON: ${e}` }] };
      }

      try {
        const client = createManagementClient();
        const body: any = {
          story: {
            name,
            content: parsedContent,
          },
        };

        if (slug) body.story.slug = slug;
        if (parentId) body.story.parent_id = parentId;
        if (isFolder) body.story.is_folder = isFolder;

        const publishParam = publish ? '?publish=1' : '';
        const response = await client.post(`/spaces/${getSpaceId()}/stories${publishParam}`, body);
        const s = response.data.story;

        return { content: [{ type: "text" as const, text: `Story created!\n\nName: ${s.name}\nSlug: ${s.full_slug}\nID: ${s.id}\nUUID: ${s.uuid}\nPublished: ${s.published ? 'Yes' : 'No'}` }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || JSON.stringify(error.response?.data) || error.message;
        return { content: [{ type: "text" as const, text: `Failed to create story: ${msg}` }] };
      }
    }
  );

  // Update story
  server.tool(
    "update_story",
    "Update an existing story's content or properties",
    {
      storyId: z.string().describe("Story ID to update"),
      name: z.string().optional().describe("New name"),
      slug: z.string().optional().describe("New slug"),
      content: z.string().optional().describe("New content as JSON string"),
      publish: z.boolean().optional().describe("Publish after update. Default: false"),
    },
    async ({ storyId, name, slug, content, publish }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();

        // Get current story first to preserve existing data
        const current = await client.get(`/spaces/${getSpaceId()}/stories/${storyId}`);
        const story: any = { ...current.data.story };

        if (name) story.name = name;
        if (slug) story.slug = slug;
        if (content) {
          try {
            story.content = JSON.parse(content);
          } catch (e) {
            return { content: [{ type: "text" as const, text: `Invalid content JSON: ${e}` }] };
          }
        }

        const publishParam = publish ? '?publish=1' : '';
        const response = await client.put(`/spaces/${getSpaceId()}/stories/${storyId}${publishParam}`, { story });
        const s = response.data.story;

        return { content: [{ type: "text" as const, text: `Story updated!\n\nName: ${s.name}\nSlug: ${s.full_slug}\nID: ${s.id}\nPublished: ${s.published ? 'Yes' : 'No'}` }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to update story: ${msg}` }] };
      }
    }
  );

  // Delete story
  server.tool(
    "delete_story",
    "Delete a story from the Storyblok space",
    {
      storyId: z.string().describe("Story ID to delete"),
    },
    async ({ storyId }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        await client.delete(`/spaces/${getSpaceId()}/stories/${storyId}`);
        return { content: [{ type: "text" as const, text: `Story ${storyId} deleted successfully.` }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to delete story: ${msg}` }] };
      }
    }
  );

  // Publish story
  server.tool(
    "publish_story",
    "Publish a story (make draft content live)",
    {
      storyId: z.string().describe("Story ID to publish"),
    },
    async ({ storyId }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        // Get current story and re-save with publish flag
        const current = await client.get(`/spaces/${getSpaceId()}/stories/${storyId}`);
        const response = await client.put(`/spaces/${getSpaceId()}/stories/${storyId}?publish=1`, {
          story: current.data.story,
        });
        const s = response.data.story;

        return { content: [{ type: "text" as const, text: `Story published!\n\nName: ${s.name}\nSlug: ${s.full_slug}\nID: ${s.id}` }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to publish story: ${msg}` }] };
      }
    }
  );

  // Unpublish story
  server.tool(
    "unpublish_story",
    "Unpublish a story (remove from live, keep as draft)",
    {
      storyId: z.string().describe("Story ID to unpublish"),
    },
    async ({ storyId }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        await client.get(`/spaces/${getSpaceId()}/stories/${storyId}/unpublish`);
        return { content: [{ type: "text" as const, text: `Story ${storyId} unpublished successfully.` }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to unpublish story: ${msg}` }] };
      }
    }
  );
}
