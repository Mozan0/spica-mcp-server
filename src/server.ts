import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import fs from "node:fs";
import path from "node:path";

// Load configuration
const configPath = path.join(process.cwd(), "config.json");
let config = {
  spicaUrl: process.env.SPICA_URL || "",
  apiKey: process.env.SPICA_API_KEY || "",
};

try {
  if (fs.existsSync(configPath)) {
    const fileConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    // Environment variables take precedence over config file
    config = {
      spicaUrl: process.env.SPICA_URL || fileConfig.spicaUrl || "",
      apiKey: process.env.SPICA_API_KEY || fileConfig.apiKey || "",
    };
  }
} catch (error) {
  console.error("Error loading config:", error);
}

// Create an MCP server
const server = new McpServer({
  name: "spica-mcp-server",
  version: "1.0.0",
});

// Helper function to make Spica API requests
async function makeSpicaRequest(method: string, endpoint: string, data?: any) {
  const baseUrl = config.spicaUrl;
  const authKey = config.apiKey;

  if (!baseUrl || !authKey) {
    throw new Error(
      "Spica URL and API key must be configured in environment variables or config.json"
    );
  }

  const url = `${baseUrl.replace(/\/$/, "")}/api${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: authKey,
  };

  try {
    let response;
    switch (method.toLowerCase()) {
      case "get":
        response = await axios.get(url, { headers });
        break;
      case "post":
        response = await axios.post(url, data, { headers });
        break;
      case "put":
        response = await axios.put(url, data, { headers });
        break;
      case "delete":
        response = await axios.delete(url, { headers });
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    return response;
  } catch (err: any) {
    throw new Error(
      err.response?.data
        ? JSON.stringify(err.response.data, null, 2)
        : err.message
    );
  }
}

// BUCKET CRUD OPERATIONS
server.registerTool(
  "bucket-list",
  {
    title: "List Buckets",
    description: "Get all buckets from Spica",
    inputSchema: {},
  },
  async () => {
    try {
      const response = await makeSpicaRequest("GET", "/bucket");
      return {
        content: [
          {
            type: "text",
            text: `✅ Buckets retrieved successfully:\n${JSON.stringify(
              response.data,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to list buckets:\n${err.message}`,
          },
        ],
      };
    }
  }
);

server.registerTool(
  "bucket-create",
  {
    title: "Create Bucket",
    description: "Create a new bucket in Spica",
    inputSchema: {
      title: z.string(),
      description: z.string(),
      properties: z.record(z.any()),
      icon: z.optional(z.string()),
      primary: z.optional(z.string()),
      readOnly: z.optional(z.boolean()),
      history: z.optional(z.boolean()),
      acl: z.optional(
        z.object({
          read: z.string(),
          write: z.string(),
        })
      ),
    },
  },
  async ({
    title,
    description,
    properties,
    icon = "view_stream",
    primary = "title",
    readOnly = false,
    history = false,
    acl = { read: "true==true", write: "true==true" },
  }) => {
    try {
      const bucketData = {
        title,
        description,
        icon,
        primary,
        readOnly,
        history,
        properties,
        acl,
        order: 0,
      };

      const response = await makeSpicaRequest("POST", "/bucket", bucketData);
      return {
        content: [
          {
            type: "text",
            text: `✅ Bucket created successfully:\n${JSON.stringify(
              response.data,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to create bucket:\n${err.message}`,
          },
        ],
      };
    }
  }
);

server.registerTool(
  "bucket-update",
  {
    title: "Update Bucket",
    description: "Update an existing bucket in Spica",
    inputSchema: {
      bucketId: z.string(),
      title: z.optional(z.string()),
      description: z.optional(z.string()),
      properties: z.optional(z.record(z.any())),
      icon: z.optional(z.string()),
      primary: z.optional(z.string()),
      readOnly: z.optional(z.boolean()),
      history: z.optional(z.boolean()),
      acl: z.optional(
        z.object({
          read: z.string(),
          write: z.string(),
        })
      ),
    },
  },
  async ({ bucketId, ...updateData }) => {
    try {
      // First get the current bucket data
      const currentResponse = await makeSpicaRequest(
        "GET",
        `/bucket/${bucketId}`
      );
      const currentData = currentResponse.data;

      // Merge with update data
      const mergedData = { ...currentData, ...updateData, _id: bucketId };

      const response = await makeSpicaRequest(
        "PUT",
        `/bucket/${bucketId}`,
        mergedData
      );
      return {
        content: [
          {
            type: "text",
            text: `✅ Bucket updated successfully:\n${JSON.stringify(
              response.data,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to update bucket:\n${err.message}`,
          },
        ],
      };
    }
  }
);

server.registerTool(
  "bucket-delete",
  {
    title: "Delete Bucket",
    description: "Delete a bucket from Spica",
    inputSchema: {
      bucketId: z.string(),
    },
  },
  async ({ bucketId }) => {
    try {
      const response = await makeSpicaRequest("DELETE", `/bucket/${bucketId}`);
      return {
        content: [
          {
            type: "text",
            text: `✅ Bucket deleted successfully`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to delete bucket:\n${err.message}`,
          },
        ],
      };
    }
  }
);

// BUCKET DATA CRUD OPERATIONS
server.registerTool(
  "bucket-data-list",
  {
    title: "List Bucket Data",
    description: "Get all data from a specific bucket",
    inputSchema: {
      bucketId: z.string(),
      limit: z.optional(z.number()),
      skip: z.optional(z.number()),
    },
  },
  async ({ bucketId, limit, skip }) => {
    try {
      let endpoint = `/bucket/${bucketId}/data`;
      const params = new URLSearchParams();
      if (limit) params.append("limit", limit.toString());
      if (skip) params.append("skip", skip.toString());
      if (params.toString()) endpoint += `?${params.toString()}`;

      const response = await makeSpicaRequest("GET", endpoint);
      return {
        content: [
          {
            type: "text",
            text: `✅ Bucket data retrieved successfully:\n${JSON.stringify(
              response.data,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to list bucket data:\n${err.message}`,
          },
        ],
      };
    }
  }
);

server.registerTool(
  "bucket-data-create",
  {
    title: "Create Bucket Data",
    description: "Add new data to a bucket",
    inputSchema: {
      bucketId: z.string(),
      data: z.record(z.any()),
    },
  },
  async ({ bucketId, data }) => {
    try {
      const response = await makeSpicaRequest(
        "POST",
        `/bucket/${bucketId}/data`,
        data
      );
      return {
        content: [
          {
            type: "text",
            text: `✅ Bucket data created successfully:\n${JSON.stringify(
              response.data,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to create bucket data:\n${err.message}`,
          },
        ],
      };
    }
  }
);

server.registerTool(
  "bucket-data-update",
  {
    title: "Update Bucket Data",
    description: "Update existing data in a bucket",
    inputSchema: {
      bucketId: z.string(),
      dataId: z.string(),
      data: z.record(z.any()),
    },
  },
  async ({ bucketId, dataId, data }) => {
    try {
      const response = await makeSpicaRequest(
        "PUT",
        `/bucket/${bucketId}/data/${dataId}`,
        data
      );
      return {
        content: [
          {
            type: "text",
            text: `✅ Bucket data updated successfully:\n${JSON.stringify(
              response.data,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to update bucket data:\n${err.message}`,
          },
        ],
      };
    }
  }
);

server.registerTool(
  "bucket-data-delete",
  {
    title: "Delete Bucket Data",
    description: "Delete specific data from a bucket",
    inputSchema: {
      bucketId: z.string(),
      dataId: z.string(),
    },
  },
  async ({ bucketId, dataId }) => {
    try {
      const response = await makeSpicaRequest(
        "DELETE",
        `/bucket/${bucketId}/data/${dataId}`
      );
      return {
        content: [
          {
            type: "text",
            text: `✅ Bucket data deleted successfully`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to delete bucket data:\n${err.message}`,
          },
        ],
      };
    }
  }
);

// FUNCTION CRUD OPERATIONS
server.registerTool(
  "function-list",
  {
    title: "List Functions",
    description: "Get all functions from Spica",
    inputSchema: {},
  },
  async () => {
    try {
      const response = await makeSpicaRequest("GET", "/function");
      return {
        content: [
          {
            type: "text",
            text: `✅ Functions retrieved successfully:\n${JSON.stringify(
              response.data,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to list functions:\n${err.message}`,
          },
        ],
      };
    }
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
