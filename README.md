# @tarasrushchak/storyblok-mcp-server

Universal [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for [Storyblok CMS](https://www.storyblok.com/). Manage components, stories, assets, datasources, and spaces directly from AI-powered tools like Claude Code, Cursor, GitHub Copilot, and more.

## Features

- **25 tools** across 5 categories
- Works with **any Storyblok space** — not tied to a specific project
- Supports all Storyblok **regions** (EU, US, CA, AP)
- Full CRUD for components and stories
- Publish/unpublish workflow
- Asset and datasource management

## Quick Start

### Claude Code

```bash
claude mcp add --scope user -e STORYBLOK_PERSONAL_ACCESS_TOKEN=your-token -e STORYBLOK_SPACE_ID=your-space-id storyblok -- npx -y @tarasrushchak/storyblok-mcp-server
```

### Cursor / VS Code

Add to your `.mcp.json` or MCP settings:

```json
{
  "mcpServers": {
    "storyblok": {
      "command": "npx",
      "args": ["-y", "@tarasrushchak/storyblok-mcp-server"],
      "env": {
        "STORYBLOK_PERSONAL_ACCESS_TOKEN": "your-token",
        "STORYBLOK_SPACE_ID": "your-space-id",
        "STORYBLOK_REGION": "eu"
      }
    }
  }
}
```

### Docker

```bash
docker run -e STORYBLOK_PERSONAL_ACCESS_TOKEN=your-token \
  -e STORYBLOK_SPACE_ID=your-space-id \
  @tarasrushchak/storyblok-mcp-server
```

## Configuration

| Variable | Required | Description |
|---|---|---|
| `STORYBLOK_PERSONAL_ACCESS_TOKEN` | Yes | Personal access token from [Storyblok settings](https://app.storyblok.com/#!/me/account?tab=token) |
| `STORYBLOK_SPACE_ID` | Yes* | Space ID (found in Space Settings or URL). Required for space-specific tools. |
| `STORYBLOK_REGION` | No | Region: `eu` (default), `us`, `ca`, `ap` |

## Tools

### Spaces (2 tools)

| Tool | Description |
|---|---|
| `list_spaces` | List all spaces accessible with the current token |
| `get_space` | Get space details (name, plan, languages, etc.) |

### Components (7 tools)

| Tool | Description |
|---|---|
| `list_components` | List all components with their fields |
| `get_component` | Get full component schema definition |
| `create_component` | Create a new component with schema fields |
| `update_component` | Update component schema or properties |
| `delete_component` | Delete a component |
| `list_component_groups` | List all component groups |
| `create_component_group` | Create a new component group |

### Stories (7 tools)

| Tool | Description |
|---|---|
| `list_stories` | List stories with filtering (by slug, content type, folder, etc.) |
| `get_story` | Get story with full content |
| `create_story` | Create a new story/content entry |
| `update_story` | Update story content or properties |
| `delete_story` | Delete a story |
| `publish_story` | Publish a story (make draft live) |
| `unpublish_story` | Unpublish a story (revert to draft) |

### Assets (4 tools)

| Tool | Description |
|---|---|
| `list_assets` | List assets with search and folder filtering |
| `get_asset` | Get asset details (filename, size, metadata) |
| `delete_asset` | Delete an asset |
| `list_asset_folders` | List asset folders |

### Datasources (5 tools)

| Tool | Description |
|---|---|
| `list_datasources` | List all datasources |
| `get_datasource_entries` | Get key-value entries of a datasource |
| `create_datasource` | Create a new datasource |
| `create_datasource_entry` | Add a key-value entry to a datasource |
| `delete_datasource` | Delete a datasource |

## Examples

### Create a component

```
"Create a Button component in Storyblok with fields: label (text, required),
url (text), variant (option: primary/secondary/tertiary), size (option: sm/md/lg),
and icon (image)"
```

### List stories by content type

```
"List all stories using the 'page' component"
```

### Manage content

```
"Create a new blog post with title 'Getting Started' and publish it"
```

## Development

```bash
git clone https://github.com/TarasKhust/storyblok-mcp-server.git
cd storyblok-mcp-server
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your credentials

# Run in development
npm run dev

# Build
npm run build
npm start
```

## License

GPL-2.0
