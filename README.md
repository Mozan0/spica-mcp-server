# Spica MCP Server

A Model Context Protocol (MCP) server for interacting with Spica instances. This server provides tools for managing buckets, bucket data, and functions in Spica.

## Installation

### For VS Code Copilot Users

Add this configuration to your VS Code settings (`settings.json`):

```json
{
  "amp.mcpServers": {
    "spica": {
      "command": "npx",
      "args": ["-y", "spica-mcp-server@latest"],
      "env": {
        "SPICA_URL": "http://localhost:59118",
        "SPICA_API_KEY": "your-spica-api-key"
      }
    }
  }
}
```

### Manual Installation

```bash
npm install -g spica-mcp-server
```

## Configuration

You can configure the server in two ways:

1. **Environment Variables** (recommended for VS Code Copilot):

   - `SPICA_URL`: Your Spica instance URL
   - `SPICA_API_KEY`: Your Spica API key

2. **Config File** (`config.json` in working directory):

   ```json
   {
     "spicaUrl": "http://localhost:59118",
     "apiKey": "YOUR_SPICA_API_KEY"
   }
   ```

3. **VS Code Copilot Integration**:

   - Make sure you have GitHub Copilot extension installed in VS Code
   - The MCP server is configured in `.vscode/settings.json` for GitHub Copilot
   - Restart VS Code after configuration changes

4. **Enable MCP in Copilot**:
   - Open VS Code Settings (Cmd/Ctrl + ,)
   - Search for "copilot mcp"
   - Enable "GitHub Copilot Chat: Experimental MCP Enabled"

## How to Use with GitHub Copilot Chat

Once configured, open GitHub Copilot Chat in VS Code and use natural language prompts like:

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

### Bucket Management (Collections)

- `bucket-list`: List all buckets
- `bucket-create`: Create a new bucket
- `bucket-update`: Update an existing bucket
- `bucket-delete`: Delete a bucket

### Bucket Data Management

- `bucket-data-list`: List data from a bucket
- `bucket-data-create`: Add new data to a bucket
- `bucket-data-update`: Update existing data in a bucket
- `bucket-data-delete`: Delete data from a bucket

### Function Management

- `function-list`: List all functions
- `function-create`: Create a new function
- `function-update`: Update an existing function
- `function-delete`: Delete a function

## Example Usage with VS Code Copilot

Once configured, you can use natural language prompts with Copilot:

1. **List users**: "List me users from the bucket-data"
2. **Add new user**: "Add a new user with name 'John Doe' and email 'john@example.com'"
3. **Update schema**: "Add an age property to the user schema/collection"
4. **Deploy function**: "Deploy a function to receive HTTP request and return 'hello world'"

## Test Prompts

Here are the specific prompts you can test:

### 1. List Users (bucket-data)

```
List me users
```

### 2. Add New User (bucket-data)

```
Add new user like this: name: "John Doe", email: "john@example.com"
```

### 3. Add Age Property to User Schema (bucket)

```
Add age property to user schema/collection
```

### 4. Deploy Hello World Function

```
Deploy a function to receive http request and return "hello world"
```

## Troubleshooting

### MCP Server Not Connecting to Copilot

1. **Check VS Code Settings**: Make sure MCP is enabled in Copilot settings
2. **Restart VS Code**: After changing MCP configuration, restart VS Code completely
3. **Check Server Status**: Run `npm run dev` manually to ensure the server starts without errors
4. **Check Logs**: Look at VS Code Developer Console (Help > Toggle Developer Tools) for MCP-related errors

### Testing the MCP Server

Run the test script to verify everything is working:

```bash
node test-mcp-connection.mjs
```

### Common Issues

- **Authentication Errors**: Make sure your Spica API key is valid and not expired
- **Network Issues**: Ensure your Spica instance is running and accessible
- **Permission Errors**: Verify your API key has the required permissions for bucket and function operations

## Running the Server

```bash
npm run dev
```

The server will start and listen for MCP requests via stdio.
