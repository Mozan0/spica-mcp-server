import { z } from "zod";

export function registerHelperTools(server: any) {
  server.addTool({
    name: "help",
    description:
      "Get guidance on how to use this MCP server effectively with proper documentation workflow.",
    parameters: z.object({}),
    execute: async () => {
      return `🚀 **Spica MCP Server - Setup & Workflow Guide**
        **📋 REQUIRED CONFIGURATION:**
        Add these environment variables to your Claude Desktop config:
        \`\`\`json
        "spica-mcp-server": {
        "command": "/path/to/spica-mcp/start-mcp.sh",
        "env": {
            "SPICA_URL": "http://localhost:4500",
            "SPICA_API_KEY": "YOUR_SPICA_API_KEY_HERE"
        }
        }
        \`\`\``;
    },
  });

  server.addTool({
    name: "workflow-guide",
    description:
      "MANDATORY FIRST STEP: Always use this to understand the required documentation-first workflow before performing ANY Spica operations. This tool explains why and how to use search/answer_question tools first.",
    parameters: z.object({}),
    execute: async () => {
      return `**WORKFLOW - READ THIS FIRST**

        **STEP 1: SEARCH DOCUMENTATION**
        - Use "search" tool with relevant keywords (e.g., "bucket creation", "identity management", "API endpoints")
        - This finds all relevant documentation files in your knowledge base
        - Never skip this step - documentation is constantly updated

        **STEP 2: GET SPECIFIC ANSWERS** 
        - Use "answer_question" tool with your specific question
        - This tool will automatically search the docs first, then fetch relevant content to provide accurate answers
        - Example: "How do I create a bucket with validation rules?"

        **STEP 3: EXECUTE SPICA OPERATIONS**
        - Only after consulting documentation, use bucket-*, passport-*, function-* tools
        - Use the exact parameters and structure learned from documentation

        **NEVER DO THIS:**
        - Don't use Spica tools without first checking documentation
        - Don't assume API structure - always verify with search/answer_question
        - Don't guess parameter names or required fields

        **WHY THIS MATTERS:**
        - Spica APIs have specific schemas and validation rules
        - Parameter names and required fields change between versions  
        - Documentation contains examples and best practices
        - Wrong API calls can cause data corruption or security issues

        **EXAMPLE WORKFLOW:**
        1. search("bucket creation validation")
        2. answer_question("What are the required fields for creating a bucket?")
        3. bucket-create (with proper parameters from docs)

        **Remember: Documentation first, operations second!**`;
    },
  });
}
