# Spica MCP Server

A Model Context Protocol (MCP) server for interacting with Spica instances. This server provides tools for managing buckets, identities, policies, API keys, and functions in Spica, with integrated documentation search capabilities.

## Installation

### For VS Code GitHub Copilot Users

**Prerequisites**:

- GitHub Copilot extension installed
- MCP-compatible extension (search for "MCP Client" or "Model Context Protocol" in VS Code marketplace)

**Note**: MCP support in VS Code is evolving. Different MCP extensions may use slightly different configuration formats. The configuration above works with most standard MCP clients.

1. **Install the MCP extension**: Install a compatible MCP extension in VS Code (like "MCP Client" or similar)

2. **Add MCP server configuration** to your VS Code settings. Open your VS Code settings (JSON) and add:

```json
{
  "mcp.servers": {
    "spica-mcp-server": {
      "command": "node",
      "args": ["/path/to/your/spica-mcp/dist/index.js"],
      "env": {
        "SPICA_URL": "http://localhost:4500",
        "SPICA_API_KEY": "YOUR_SPICA_API_KEY_HERE"
      }
    }
  }
}
```

**Alternative method using npm:**

```json
{
  "mcp.servers": {
    "spica-mcp-server": {
      "command": "npm",
      "args": ["run", "start"],
      "cwd": "/path/to/your/spica-mcp",
      "env": {
        "SPICA_URL": "http://localhost:4500",
        "SPICA_API_KEY": "YOUR_SPICA_API_KEY_HERE"
      }
    }
  }
}
```

### For Claude Desktop Users

Add this configuration to your Claude Desktop config file (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "spica-mcp-server": {
      "command": "/path/to/your/spica-mcp/start-mcp.sh",
      "env": {
        "SPICA_URL": "http://localhost:4500",
        "SPICA_API_KEY": "YOUR_SPICA_API_KEY_HERE"
      }
    }
  }
}
```

### Manual Installation

```bash
git clone https://github.com/your-username/spica-mcp-server.git
cd spica-mcp-server
npm install
npm run build
```

### Setup

1. **Copy the example settings**:

   ```bash
   cp .vscode/settings.json
   ```

2. **Edit the settings**: Update `SPICA_URL` and `SPICA_API_KEY` in `.vscode/settings.json`

3. **Install recommended extensions**: VS Code will automatically suggest installing GitHub Copilot extensions

## Configuration

The server is configured entirely through environment variables in your Claude Desktop configuration:

### Required Variables (from users)

- `SPICA_URL`: Your Spica instance URL (e.g., `http://localhost:4500`)
- `SPICA_API_KEY`: Your Spica API key/token

### Pre-configured (no user setup needed)

- Documentation search and AI-powered answers are built-in

### Getting Your Spica API Key

1. Open your Spica dashboard
2. Go to **Passport** → **API Keys**
3. Create a new API key with required permissions
4. Copy the key and use it as `SPICA_API_KEY`

## Configuration File Locations

### Claude Desktop

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

### VS Code

- **Settings JSON**: Open VS Code → Preferences → Settings → Open Settings (JSON)
- **Workspace Settings**: `.vscode/settings.json` in your project root (for project-specific configuration)

## How to Use

### With Claude Desktop

Once configured, you can use natural language prompts with Claude. The server includes a **documentation-first workflow** that encourages searching documentation before performing operations.

### With VS Code GitHub Copilot

After installing an MCP extension and configuring the server, you can:

1. Use the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) to access MCP commands
2. Use Copilot Chat with MCP tools integrated
3. Access Spica management tools directly from your development environment

### Recommended Workflow

1. **Always start with documentation**: Use `search` and `answer_question` tools
2. **Then perform operations**: Use Spica tools with proper understanding

### Example Session (Claude):

```
Human: I want to create a new bucket for user profiles

Claude: I'll help you create a user profiles bucket. Let me first search the documentation to understand the proper structure and requirements.

[Uses search tool to find bucket documentation]
[Uses answer_question tool to get specific guidance]
[Then uses bucket-create tool with proper parameters]
```

### Example Session (VS Code Copilot):

```
// In VS Code, you can use Copilot Chat or MCP commands
// Example: Using Command Palette
1. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)
2. Type "MCP: Execute Tool"
3. Select "bucket-list" to see all buckets
4. Or use Copilot Chat: "@mcp create a user bucket with name, email, age fields"
```

### Example Prompts:

1. **"Create me a test bucket with fields name, email, and age"**

   - Copilot will use the `bucket-create` tool

2. **"List all my buckets"**

   - Copilot will use the `bucket-list` tool

3. **"Add a new user with name 'John Doe', email 'john@example.com', age 25"**

   - Copilot will use the `bucket-data-create` tool

4. **"Create a function that returns hello world for HTTP requests"**

   - Copilot will use the `function-create` tool

5. **"Show me all users in my database"**
   - Copilot will use the `bucket-data-list` tool

## Available Tools

### 📚 Documentation & Help

- `help`: Get setup guidance and workflow instructions
- `search`: Search documentation for APIs and functionality
- `answer_question`: Get AI-powered answers from documentation
- `fetch`: Retrieve document metadata

### 🗂️ Bucket Management (Collections)

- `bucket-list`: List all buckets
- `bucket-create`: Create a new bucket
- `bucket-update`: Update an existing bucket
- `bucket-delete`: Delete a bucket

### 📊 Bucket Data Management

- `bucket-data-list`: List data from a bucket
- `bucket-data-create`: Add new data to a bucket
- `bucket-data-update`: Update existing data in a bucket
- `bucket-data-delete`: Delete data from a bucket

### 👥 Identity Management (Users)

- `passport-identity-list`: List all identities
- `passport-identity-get`: Get specific identity
- `passport-identity-create`: Create a new identity
- `passport-identity-update`: Update an existing identity
- `passport-identity-delete`: Delete an identity
- `passport-identity-verify`: Verify identity token
- `passport-login`: Login with credentials

### 🔑 API Key Management

- `passport-apikey-list`: List all API keys
- `passport-apikey-get`: Get specific API key
- `passport-apikey-create`: Create a new API key
- `passport-apikey-update`: Update an existing API key
- `passport-apikey-delete`: Delete an API key
- `passport-apikey-assign-policy`: Assign policy to API key
- `passport-apikey-remove-policy`: Remove policy from API key

### 🛡️ Policy Management (Permissions)

- `passport-policy-list`: List all policies
- `passport-policy-get`: Get specific policy
- `passport-policy-create`: Create a new policy
- `passport-policy-update`: Update an existing policy
- `passport-policy-delete`: Delete a policy

### ⚡ Function Management

- `function-list`: List all functions

## Example Usage with Claude

### Basic Workflow Examples:

1. **Setting up user management**:

   ```
   Help me set up user management in Spica. I need to create user identities and manage permissions.
   ```

2. **Creating a blog system**:

   ```
   I want to create a blog system with posts and authors. Help me set up the buckets and data structure.
   ```

3. **Managing API access**:
   ```
   I need to create API keys with different permission levels for my mobile app and admin panel.
   ```

## ⚠️ Important: Documentation-First Approach

This MCP server is designed to encourage best practices by **searching documentation first**. Many tools include guidance to:

- Use `search` tool before operations
- Use `answer_question` to understand proper syntax
- Verify API structure and requirements before making changes

This prevents errors and ensures you're following current best practices.

## Troubleshooting

### VS Code GitHub Copilot Issues

1. **MCP Server Not Connecting**:

   - Ensure you have an MCP-compatible extension installed
   - Check that the server path in settings.json is correct and absolute
   - Restart VS Code after changing MCP configuration
   - Verify the server builds successfully: `npm run build`

2. **Check Server Status**:

   - Run `npm run dev` manually to ensure the server starts without errors
   - Check VS Code Developer Console (Help > Toggle Developer Tools) for MCP-related errors

3. **Extension Requirements**:
   - Install "MCP Client" or compatible MCP extension from VS Code marketplace
   - Ensure GitHub Copilot extension is installed and active
   - Check that both extensions are compatible with each other

### Claude Desktop Issues

1. **MCP Server Not Connecting to Claude**:
   - Check that `start-mcp.sh` has execute permissions: `chmod +x start-mcp.sh`
   - Verify the path in `claude_desktop_config.json` is correct
   - Restart Claude Desktop after configuration changes

### Common Issues (Both Platforms)

- **Authentication Errors**: Make sure your Spica API key is valid and not expired
- **Network Issues**: Ensure your Spica instance is running and accessible
- **Permission Errors**: Verify your API key has the required permissions for bucket and function operations
- **Environment Variables**: Double-check that `SPICA_URL` and `SPICA_API_KEY` are set correctly

## Running the Server

```bash
npm run dev
```

The server will start and listen for MCP requests via stdio.
