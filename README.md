# Spica MCP Server

A Model Context Protocol (MCP) server for interacting with Spica instances. This server provides tools for managing buckets, identities, policies, API keys, and functions in Spica, with integrated documentation search capabilities.

## Installation

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

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

## How to Use with Claude

Once configured, you can use natural language prompts with Claude. The server includes a **documentation-first workflow** that encourages searching documentation before performing operations.

### Recommended Workflow

1. **Always start with documentation**: Use `search` and `answer_question` tools
2. **Then perform operations**: Use Spica tools with proper understanding

### Example Session:

```
Human: I want to create a new bucket for user profiles

Claude: I'll help you create a user profiles bucket. Let me first search the documentation to understand the proper structure and requirements.

[Uses search tool to find bucket documentation]
[Uses answer_question tool to get specific guidance]
[Then uses bucket-create tool with proper parameters]
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

### MCP Server Not Connecting to Copilot

1. **Check VS Code Settings**: Make sure MCP is enabled in Copilot settings
2. **Restart VS Code**: After changing MCP configuration, restart VS Code completely
3. **Check Server Status**: Run `npm run dev` manually to ensure the server starts without errors
4. **Check Logs**: Look at VS Code Developer Console (Help > Toggle Developer Tools) for MCP-related errors

### Common Issues

- **Authentication Errors**: Make sure your Spica API key is valid and not expired
- **Network Issues**: Ensure your Spica instance is running and accessible
- **Permission Errors**: Verify your API key has the required permissions for bucket and function operations

## Running the Server

```bash
npm run dev
```

The server will start and listen for MCP requests via stdio.
