import { z } from 'zod';
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { validateSpaceConfig, getSpaceId } from '../config.js';
import { createManagementClient } from '../clients.js';

export function registerComponentTools(server: McpServer): void {
  // List all components
  server.tool(
    "list_components",
    "List all components in the Storyblok space",
    {},
    async () => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}. Please set STORYBLOK_PERSONAL_ACCESS_TOKEN and STORYBLOK_SPACE_ID.` }] };
      }

      try {
        const client = createManagementClient();
        const response = await client.get(`/spaces/${getSpaceId()}/components`);
        const components = response.data.components || [];

        if (components.length === 0) {
          return { content: [{ type: "text" as const, text: "No components found in this space." }] };
        }

        const result = components.map((c: any) =>
          `Name: ${c.name}\nDisplay Name: ${c.display_name || c.name}\nID: ${c.id}\nIs Root: ${c.is_root || false}\nIs Nestable: ${c.is_nestable || false}\nComponent Group: ${c.component_group_name || 'none'}\nFields: ${Object.keys(c.schema || {}).join(', ') || 'none'}`
        ).join('\n\n---\n\n');

        return { content: [{ type: "text" as const, text: result }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to list components: ${msg}` }] };
      }
    }
  );

  // Get single component
  server.tool(
    "get_component",
    "Get details of a specific component including its full schema definition",
    {
      componentId: z.string().describe("Component ID (numeric string)"),
    },
    async ({ componentId }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        const response = await client.get(`/spaces/${getSpaceId()}/components/${componentId}`);
        const c = response.data.component;

        const schemaFields = Object.entries(c.schema || {}).map(([key, field]: [string, any]) =>
          `  ${key}: type=${field.type}${field.required ? ' (required)' : ''}${field.description ? ` — ${field.description}` : ''}${field.default_value !== undefined ? ` [default: ${field.default_value}]` : ''}${field.options ? ` [options: ${field.options.map((o: any) => o.value || o.name).join(', ')}]` : ''}`
        ).join('\n');

        const result = [
          `Name: ${c.name}`,
          `Display Name: ${c.display_name || c.name}`,
          `ID: ${c.id}`,
          `Is Root: ${c.is_root || false}`,
          `Is Nestable: ${c.is_nestable || false}`,
          `Component Group: ${c.component_group_name || 'none'}`,
          `Preview Field: ${c.preview_field || 'none'}`,
          `Image: ${c.image || 'none'}`,
          `Color: ${c.color || 'none'}`,
          `Icon: ${c.icon || 'none'}`,
          `Created: ${c.created_at}`,
          `Updated: ${c.updated_at}`,
          `\nSchema:\n${schemaFields || '  (no fields)'}`,
        ].join('\n');

        return { content: [{ type: "text" as const, text: result }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to get component: ${msg}` }] };
      }
    }
  );

  // Create component
  server.tool(
    "create_component",
    "Create a new component in the Storyblok space. Schema fields should be a JSON object where keys are field names and values are field definitions with at least a 'type' property.",
    {
      name: z.string().describe("Technical name of the component (lowercase, underscores)"),
      displayName: z.string().optional().describe("Display name shown in the editor"),
      schema: z.string().describe("JSON string of the component schema. Example: {\"title\":{\"type\":\"text\",\"required\":true},\"image\":{\"type\":\"image\"},\"variant\":{\"type\":\"option\",\"options\":[{\"value\":\"primary\",\"name\":\"Primary\"},{\"value\":\"secondary\",\"name\":\"Secondary\"}]}}"),
      isRoot: z.boolean().optional().describe("Whether this component can be used as a content type (root level). Default: false"),
      isNestable: z.boolean().optional().describe("Whether this component can be nested inside other components. Default: true"),
      componentGroupId: z.string().optional().describe("ID of the component group to assign to"),
      image: z.string().optional().describe("URL of a preview image for the component"),
      previewField: z.string().optional().describe("Field name to use as preview in the editor"),
      color: z.string().optional().describe("Color for the component icon (hex, e.g. '#00b3b0')"),
      icon: z.string().optional().describe("Icon name for the component"),
    },
    async ({ name, displayName, schema, isRoot, isNestable, componentGroupId, image, previewField, color, icon }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      let parsedSchema: Record<string, any>;
      try {
        parsedSchema = JSON.parse(schema);
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Invalid schema JSON: ${e}` }] };
      }

      try {
        const client = createManagementClient();
        const body: any = {
          component: {
            name,
            schema: parsedSchema,
            is_root: isRoot ?? false,
            is_nestable: isNestable ?? true,
          },
        };

        if (displayName) body.component.display_name = displayName;
        if (componentGroupId) body.component.component_group_uuid = componentGroupId;
        if (image) body.component.image = image;
        if (previewField) body.component.preview_field = previewField;
        if (color) body.component.color = color;
        if (icon) body.component.icon = icon;

        const response = await client.post(`/spaces/${getSpaceId()}/components`, body);
        const c = response.data.component;

        return { content: [{ type: "text" as const, text: `Component created successfully!\n\nName: ${c.name}\nID: ${c.id}\nDisplay Name: ${c.display_name || c.name}\nFields: ${Object.keys(c.schema || {}).join(', ')}` }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || JSON.stringify(error.response?.data) || error.message;
        return { content: [{ type: "text" as const, text: `Failed to create component: ${msg}` }] };
      }
    }
  );

  // Update component
  server.tool(
    "update_component",
    "Update an existing component's schema or properties",
    {
      componentId: z.string().describe("Component ID to update"),
      displayName: z.string().optional().describe("New display name"),
      schema: z.string().optional().describe("New schema as JSON string (replaces entire schema)"),
      isRoot: z.boolean().optional().describe("Whether this component can be used as a content type"),
      isNestable: z.boolean().optional().describe("Whether this component can be nested"),
      image: z.string().optional().describe("Preview image URL"),
      previewField: z.string().optional().describe("Field name to use as preview"),
      color: z.string().optional().describe("Component icon color (hex)"),
      icon: z.string().optional().describe("Component icon name"),
    },
    async ({ componentId, displayName, schema, isRoot, isNestable, image, previewField, color, icon }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        const body: any = { component: {} };

        if (displayName !== undefined) body.component.display_name = displayName;
        if (schema) {
          try {
            body.component.schema = JSON.parse(schema);
          } catch (e) {
            return { content: [{ type: "text" as const, text: `Invalid schema JSON: ${e}` }] };
          }
        }
        if (isRoot !== undefined) body.component.is_root = isRoot;
        if (isNestable !== undefined) body.component.is_nestable = isNestable;
        if (image !== undefined) body.component.image = image;
        if (previewField !== undefined) body.component.preview_field = previewField;
        if (color !== undefined) body.component.color = color;
        if (icon !== undefined) body.component.icon = icon;

        const response = await client.put(`/spaces/${getSpaceId()}/components/${componentId}`, body);
        const c = response.data.component;

        return { content: [{ type: "text" as const, text: `Component updated successfully!\n\nName: ${c.name}\nID: ${c.id}\nFields: ${Object.keys(c.schema || {}).join(', ')}` }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to update component: ${msg}` }] };
      }
    }
  );

  // Delete component
  server.tool(
    "delete_component",
    "Delete a component from the Storyblok space",
    {
      componentId: z.string().describe("Component ID to delete"),
    },
    async ({ componentId }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        await client.delete(`/spaces/${getSpaceId()}/components/${componentId}`);
        return { content: [{ type: "text" as const, text: `Component ${componentId} deleted successfully.` }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to delete component: ${msg}` }] };
      }
    }
  );

  // List component groups
  server.tool(
    "list_component_groups",
    "List all component groups in the Storyblok space",
    {},
    async () => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        const response = await client.get(`/spaces/${getSpaceId()}/component_groups`);
        const groups = response.data.component_groups || [];

        if (groups.length === 0) {
          return { content: [{ type: "text" as const, text: "No component groups found." }] };
        }

        const result = groups.map((g: any) =>
          `Name: ${g.name}\nID: ${g.id}\nUUID: ${g.uuid}`
        ).join('\n\n---\n\n');

        return { content: [{ type: "text" as const, text: result }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to list component groups: ${msg}` }] };
      }
    }
  );

  // Create component group
  server.tool(
    "create_component_group",
    "Create a new component group",
    {
      name: z.string().describe("Name of the component group"),
    },
    async ({ name }) => {
      const configError = validateSpaceConfig();
      if (configError) {
        return { content: [{ type: "text" as const, text: `Configuration error: ${configError}` }] };
      }

      try {
        const client = createManagementClient();
        const response = await client.post(`/spaces/${getSpaceId()}/component_groups`, {
          component_group: { name },
        });
        const g = response.data.component_group;

        return { content: [{ type: "text" as const, text: `Component group created!\n\nName: ${g.name}\nID: ${g.id}\nUUID: ${g.uuid}` }] };
      } catch (error: any) {
        const msg = error.response?.data?.error || error.response?.data?.message || error.message;
        return { content: [{ type: "text" as const, text: `Failed to create component group: ${msg}` }] };
      }
    }
  );
}
