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

// PASSPORT: IDENTITIES
server.registerTool(
  "passport-identity-list",
  {
    title: "List Identities",
    description: "Get all identities from Spica",
    inputSchema: {
      limit: z.optional(z.number()),
      skip: z.optional(z.number()),
      sort: z.optional(z.string()),
    },
  },
  async ({ limit, skip, sort }) => {
    try {
      let endpoint = "/passport/identity";
      const params = new URLSearchParams();
      if (limit) params.append("limit", limit.toString());
      if (skip) params.append("skip", skip.toString());
      if (sort) params.append("sort", sort);
      if (params.toString()) endpoint += `?${params.toString()}`;

      const response = await makeSpicaRequest("GET", endpoint);
      return {
        content: [
          {
            type: "text",
            text: `✅ Identities retrieved successfully:\n${JSON.stringify(
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
            text: `❌ Failed to list identities:\n${err.message}`,
          },
        ],
      };
    }
  }
);

server.registerTool(
  "passport-identity-get",
  {
    title: "Get Identity",
    description: "Get a single identity by id",
    inputSchema: { id: z.string() },
  },
  async ({ id }) => {
    try {
      const response = await makeSpicaRequest(
        "GET",
        `/passport/identity/${id}`
      );
      return {
        content: [
          {
            type: "text",
            text: `✅ Identity retrieved successfully:\n${JSON.stringify(
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
            text: `❌ Failed to get identity:\n${err.message}`,
          },
        ],
      };
    }
  }
);

server.registerTool(
  "passport-identity-create",
  {
    title: "Create Identity",
    description: "Create a new identity in Spica",
    inputSchema: {
      identifier: z.string(),
      password: z.string(),
      attributes: z.optional(z.record(z.any())),
    },
  },
  async ({ identifier, password, attributes }) => {
    try {
      const body: any = { identifier, password };
      if (attributes) body.attributes = attributes;
      const response = await makeSpicaRequest(
        "POST",
        "/passport/identity",
        body
      );
      return {
        content: [
          {
            type: "text",
            text: `✅ Identity created successfully:\n${JSON.stringify(
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
            text: `❌ Failed to create identity:\n${err.message}`,
          },
        ],
      };
    }
  }
);

server.registerTool(
  "passport-identity-update",
  {
    title: "Update Identity",
    description: "Update an existing identity",
    inputSchema: {
      id: z.string(),
      identifier: z.optional(z.string()),
      password: z.optional(z.string()),
      attributes: z.optional(z.record(z.any())),
    },
  },
  async ({ id, ...update }) => {
    try {
      // Fetch current
      const current = await makeSpicaRequest("GET", `/passport/identity/${id}`);
      const merged = { ...current.data, ...update, _id: id };
      const response = await makeSpicaRequest(
        "PUT",
        `/passport/identity/${id}`,
        merged
      );
      return {
        content: [
          {
            type: "text",
            text: `✅ Identity updated successfully:\n${JSON.stringify(
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
            text: `❌ Failed to update identity:\n${err.message}`,
          },
        ],
      };
    }
  }
);

server.registerTool(
  "passport-identity-delete",
  {
    title: "Delete Identity",
    description: "Delete an identity",
    inputSchema: { id: z.string() },
  },
  async ({ id }) => {
    try {
      const response = await makeSpicaRequest(
        "DELETE",
        `/passport/identity/${id}`
      );
      return {
        content: [{ type: "text", text: `✅ Identity deleted successfully` }],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to delete identity:\n${err.message}`,
          },
        ],
      };
    }
  }
);

server.registerTool(
  "passport-identity-verify",
  {
    title: "Verify Identity Token",
    description: "Verify current identity token",
    inputSchema: {},
  },
  async () => {
    try {
      const response = await makeSpicaRequest(
        "GET",
        "/passport/identity/verify"
      );
      return {
        content: [
          {
            type: "text",
            text: `✅ Token verified:\n${JSON.stringify(
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
          { type: "text", text: `❌ Token verify failed:\n${err.message}` },
        ],
      };
    }
  }
);

// Login (identify) - this endpoint doesn't require API key auth
server.registerTool(
  "passport-login",
  {
    title: "Login (Identify)",
    description: "Obtain access and refresh tokens by identifier/password",
    inputSchema: { identifier: z.string(), password: z.string() },
  },
  async ({ identifier, password }) => {
    try {
      const response = await makeSpicaRequest("POST", "/passport/identify", {
        identifier,
        password,
      });
      return {
        content: [
          {
            type: "text",
            text: `✅ Login successful:\n${JSON.stringify(
              response.data,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `❌ Login failed:\n${err.message}` }],
      };
    }
  }
);

// PASSPORT: API KEYS
server.registerTool(
  "passport-apikey-list",
  {
    title: "List API Keys",
    description: "Get all API keys",
    inputSchema: {},
  },
  async () => {
    try {
      const response = await makeSpicaRequest("GET", "/passport/apikey");
      return {
        content: [
          {
            type: "text",
            text: `✅ API keys:\n${JSON.stringify(response.data, null, 2)}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          { type: "text", text: `❌ Failed to list apikeys:\n${err.message}` },
        ],
      };
    }
  }
);

server.registerTool(
  "passport-apikey-get",
  {
    title: "Get API Key",
    description: "Get a single API key by id",
    inputSchema: { id: z.string() },
  },
  async ({ id }) => {
    try {
      const response = await makeSpicaRequest("GET", `/passport/apikey/${id}`);
      return {
        content: [
          {
            type: "text",
            text: `✅ API key:\n${JSON.stringify(response.data, null, 2)}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          { type: "text", text: `❌ Failed to get apikey:\n${err.message}` },
        ],
      };
    }
  }
);

server.registerTool(
  "passport-apikey-create",
  {
    title: "Create API Key",
    description: "Create a new API key",
    inputSchema: {
      name: z.string(),
      description: z.optional(z.string()),
      active: z.optional(z.boolean()),
      // optional policies to attach immediately after creation
      policies: z.optional(z.array(z.string())),
    },
  },
  async ({ name, description, active = true, policies }) => {
    try {
      const body: any = { name, description, active };
      const response = await makeSpicaRequest("POST", "/passport/apikey", body);
      const created = response.data;

      // If policies provided, assign them to the newly created apikey
      if (policies && policies.length > 0) {
        for (const policyId of policies) {
          try {
            await makeSpicaRequest(
              "PUT",
              `/passport/apikey/${created._id}/policy/${policyId}`
            );
          } catch (innerErr: any) {
            // continue assigning others but report error
            return {
              content: [
                {
                  type: "text",
                  text: `⚠️ API key created but failed to assign policy ${policyId}:\n${innerErr.message}`,
                },
              ],
            };
          }
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `✅ API key created successfully:\n${JSON.stringify(
              created,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          { type: "text", text: `❌ Failed to create apikey:\n${err.message}` },
        ],
      };
    }
  }
);

server.registerTool(
  "passport-apikey-update",
  {
    title: "Update API Key",
    description: "Update an API key (name/description/active)",
    inputSchema: {
      id: z.string(),
      name: z.optional(z.string()),
      description: z.optional(z.string()),
      active: z.optional(z.boolean()),
    },
  },
  async ({ id, ...update }) => {
    try {
      const current = await makeSpicaRequest("GET", `/passport/apikey/${id}`);
      const merged = { ...current.data, ...update };
      const response = await makeSpicaRequest(
        "PUT",
        `/passport/apikey/${id}`,
        merged
      );
      return {
        content: [
          {
            type: "text",
            text: `✅ API key updated:\n${JSON.stringify(
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
          { type: "text", text: `❌ Failed to update apikey:\n${err.message}` },
        ],
      };
    }
  }
);

server.registerTool(
  "passport-apikey-delete",
  {
    title: "Delete API Key",
    description: "Delete an API key",
    inputSchema: { id: z.string() },
  },
  async ({ id }) => {
    try {
      await makeSpicaRequest("DELETE", `/passport/apikey/${id}`);
      return { content: [{ type: "text", text: `✅ API key deleted` }] };
    } catch (err: any) {
      return {
        content: [
          { type: "text", text: `❌ Failed to delete apikey:\n${err.message}` },
        ],
      };
    }
  }
);

server.registerTool(
  "passport-apikey-assign-policy",
  {
    title: "Assign Policy to API Key",
    description: "Assign a policy to an existing API key",
    inputSchema: { apikeyId: z.string(), policyId: z.string() },
  },
  async ({ apikeyId, policyId }) => {
    try {
      const response = await makeSpicaRequest(
        "PUT",
        `/passport/apikey/${apikeyId}/policy/${policyId}`
      );
      return {
        content: [
          {
            type: "text",
            text: `✅ Policy assigned to API key:\n${JSON.stringify(
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
            text: `❌ Failed to assign policy to apikey:\n${err.message}`,
          },
        ],
      };
    }
  }
);

server.registerTool(
  "passport-apikey-remove-policy",
  {
    title: "Remove Policy from API Key",
    description: "Remove a policy from an API key",
    inputSchema: { apikeyId: z.string(), policyId: z.string() },
  },
  async ({ apikeyId, policyId }) => {
    try {
      await makeSpicaRequest(
        "DELETE",
        `/passport/apikey/${apikeyId}/policy/${policyId}`
      );
      return {
        content: [{ type: "text", text: `✅ Policy removed from API key` }],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to remove policy from apikey:\n${err.message}`,
          },
        ],
      };
    }
  }
);

// PASSPORT: POLICIES
server.registerTool(
  "passport-policy-list",
  {
    title: "List Policies",
    description: "Get all policies",
    inputSchema: {},
  },
  async () => {
    try {
      const response = await makeSpicaRequest("GET", "/passport/policy");
      return {
        content: [
          {
            type: "text",
            text: `✅ Policies:\n${JSON.stringify(response.data, null, 2)}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          { type: "text", text: `❌ Failed to list policies:\n${err.message}` },
        ],
      };
    }
  }
);

server.registerTool(
  "passport-policy-get",
  {
    title: "Get Policy",
    description: "Get a single policy by id",
    inputSchema: { id: z.string() },
  },
  async ({ id }) => {
    try {
      const response = await makeSpicaRequest("GET", `/passport/policy/${id}`);
      return {
        content: [
          {
            type: "text",
            text: `✅ Policy:\n${JSON.stringify(response.data, null, 2)}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          { type: "text", text: `❌ Failed to get policy:\n${err.message}` },
        ],
      };
    }
  }
);

server.registerTool(
  "passport-policy-create",
  {
    title: "Create Policy",
    description: "Create a new policy",
    inputSchema: {
      name: z.string(),
      description: z.string(),
      statement: z.array(
        z.object({
          action: z.string(),
          module: z.string(),
          resource: z.optional(
            z.object({
              include: z.optional(z.array(z.string())),
              exclude: z.optional(z.array(z.string())),
            })
          ),
        })
      ),
    },
  },
  async ({ name, description, statement }) => {
    try {
      const body = { name, description, statement };
      const response = await makeSpicaRequest("POST", "/passport/policy", body);
      return {
        content: [
          {
            type: "text",
            text: `✅ Policy created:\n${JSON.stringify(
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
          { type: "text", text: `❌ Failed to create policy:\n${err.message}` },
        ],
      };
    }
  }
);

server.registerTool(
  "passport-policy-update",
  {
    title: "Update Policy",
    description: "Update an existing policy",
    inputSchema: {
      id: z.string(),
      name: z.optional(z.string()),
      description: z.optional(z.string()),
      statement: z.optional(
        z.array(
          z.object({
            action: z.string(),
            module: z.string(),
            resource: z.optional(
              z.object({
                include: z.optional(z.array(z.string())),
                exclude: z.optional(z.array(z.string())),
              })
            ),
          })
        )
      ),
    },
  },
  async ({ id, ...update }) => {
    try {
      const current = await makeSpicaRequest("GET", `/passport/policy/${id}`);
      const merged = { ...current.data, ...update };
      const response = await makeSpicaRequest(
        "PUT",
        `/passport/policy/${id}`,
        merged
      );
      return {
        content: [
          {
            type: "text",
            text: `✅ Policy updated:\n${JSON.stringify(
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
          { type: "text", text: `❌ Failed to update policy:\n${err.message}` },
        ],
      };
    }
  }
);

server.registerTool(
  "passport-policy-delete",
  {
    title: "Delete Policy",
    description: "Delete a policy",
    inputSchema: { id: z.string() },
  },
  async ({ id }) => {
    try {
      await makeSpicaRequest("DELETE", `/passport/policy/${id}`);
      return { content: [{ type: "text", text: `✅ Policy deleted` }] };
    } catch (err: any) {
      return {
        content: [
          { type: "text", text: `❌ Failed to delete policy:\n${err.message}` },
        ],
      };
    }
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
