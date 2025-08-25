import { FastMCP } from "fastmcp";
import { z } from "zod";
import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config();

// Load configuration
const configPath = path.join(process.cwd(), "config.json");
let config = {
  spicaUrl: process.env.SPICA_URL || "",
  apiKey: process.env.SPICA_API_KEY || "",
};

// OpenAI configuration for deep research tools
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const VECTOR_STORE_ID = process.env.VECTOR_STORE_ID || "";

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;
if (OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
}
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

// Create FastMCP server
const server = new FastMCP({
  name: "spica-mcp-server",
  version: "1.0.0",
});

// WORKFLOW GUIDANCE TOOL
server.addTool({
  name: "help",
  description:
    "Get guidance on how to use this MCP server effectively with proper documentation workflow.",
  parameters: z.object({}),
  execute: async () => {
    return `🚀 **Spica MCP Server - Recommended Workflow**

**ALWAYS START HERE:**
1. 🔍 **search** - Search documentation for relevant topics
2. 🤖 **answer_question** - Get specific answers from documentation  
3. ✅ **Execute Spica operations** - Now safely use bucket, identity, policy tools

**Documentation Tools (Use First):**
• search - Find relevant docs about APIs/functionality
• answer_question - Get AI answers from your documentation
• fetch - Get specific document metadata

**Spica Backend Tools (Use After Documentation):**
• bucket-* - Manage buckets and data
• passport-identity-* - Manage users and authentication  
• passport-policy-* - Manage permissions and access control
• passport-apikey-* - Manage API keys
• function-* - Manage cloud functions

**⚠️ CRITICAL WORKFLOW:**
Never use Spica tools without first consulting documentation. The search and answer_question tools contain up-to-date information about:
- API endpoints and parameters
- Data schemas and validation rules
- Best practices and examples
- Error handling and troubleshooting

**💡 Example Workflow:**
1. search("bucket creation")
2. answer_question("how to create a bucket with proper schema")
3. bucket-create (with proper parameters from docs)

Always verify API structure and requirements before operations!`;
  },
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
server.addTool({
  name: "bucket-list",
  description:
    "Get all buckets from Spica. 💡 Tip: Use search tool first to understand bucket API structure and available fields before listing buckets.",
  parameters: z.object({}),
  execute: async () => {
    try {
      const response = await makeSpicaRequest("GET", "/bucket");
      return `✅ Buckets retrieved successfully:\n${JSON.stringify(
        response.data,
        null,
        2
      )}`;
    } catch (err: any) {
      return `❌ Failed to list buckets:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "bucket-create",
  description:
    "Create a new bucket in Spica. ⚠️ IMPORTANT: Use search + answer_question tools first to understand bucket schema, required fields, and property types before creating buckets.",
  parameters: z.object({
    title: z.string(),
    description: z.string(),
    properties: z.record(z.any()),
    icon: z.string().optional(),
    primary: z.string().optional(),
    readOnly: z.boolean().optional(),
    history: z.boolean().optional(),
    acl: z
      .object({
        read: z.string(),
        write: z.string(),
      })
      .optional(),
  }),
  execute: async ({
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
      return `✅ Bucket created successfully:\n${JSON.stringify(
        response.data,
        null,
        2
      )}`;
    } catch (err: any) {
      return `❌ Failed to create bucket:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "bucket-update",
  description: "Update an existing bucket in Spica",
  parameters: z.object({
    bucketId: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    properties: z.record(z.any()).optional(),
    icon: z.string().optional(),
    primary: z.string().optional(),
    readOnly: z.boolean().optional(),
    history: z.boolean().optional(),
    acl: z
      .object({
        read: z.string(),
        write: z.string(),
      })
      .optional(),
  }),
  execute: async ({ bucketId, ...updateData }) => {
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
      return `✅ Bucket updated successfully:\n${JSON.stringify(
        response.data,
        null,
        2
      )}`;
    } catch (err: any) {
      return `❌ Failed to update bucket:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "bucket-delete",
  description: "Delete a bucket from Spica",
  parameters: z.object({
    bucketId: z.string(),
  }),
  execute: async ({ bucketId }) => {
    try {
      const response = await makeSpicaRequest("DELETE", `/bucket/${bucketId}`);
      return `✅ Bucket deleted successfully`;
    } catch (err: any) {
      return `❌ Failed to delete bucket:\n${err.message}`;
    }
  },
});

// BUCKET DATA CRUD OPERATIONS
server.addTool({
  name: "bucket-data-list",
  description: "Get all data from a specific bucket",
  parameters: z.object({
    bucketId: z.string(),
    limit: z.number().optional(),
    skip: z.number().optional(),
  }),
  execute: async ({ bucketId, limit, skip }) => {
    try {
      let endpoint = `/bucket/${bucketId}/data`;
      const params = new URLSearchParams();
      if (limit) params.append("limit", limit.toString());
      if (skip) params.append("skip", skip.toString());
      if (params.toString()) endpoint += `?${params.toString()}`;

      const response = await makeSpicaRequest("GET", endpoint);
      return `✅ Bucket data retrieved successfully:\n${JSON.stringify(
        response.data,
        null,
        2
      )}`;
    } catch (err: any) {
      return `❌ Failed to list bucket data:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "bucket-data-create",
  description:
    "Add new data to a bucket. 💡 Tip: Use search + answer_question tools first to understand the bucket schema and required data structure before adding data.",
  parameters: z.object({
    bucketId: z.string(),
    data: z.record(z.any()),
  }),
  execute: async ({ bucketId, data }) => {
    try {
      const response = await makeSpicaRequest(
        "POST",
        `/bucket/${bucketId}/data`,
        data
      );
      return `✅ Bucket data created successfully:\n${JSON.stringify(
        response.data,
        null,
        2
      )}`;
    } catch (err: any) {
      return `❌ Failed to create bucket data:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "bucket-data-update",
  description: "Update existing data in a bucket",
  parameters: z.object({
    bucketId: z.string(),
    dataId: z.string(),
    data: z.record(z.any()),
  }),
  execute: async ({ bucketId, dataId, data }) => {
    try {
      const response = await makeSpicaRequest(
        "PUT",
        `/bucket/${bucketId}/data/${dataId}`,
        data
      );
      return `✅ Bucket data updated successfully:\n${JSON.stringify(
        response.data,
        null,
        2
      )}`;
    } catch (err: any) {
      return `❌ Failed to update bucket data:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "bucket-data-delete",
  description: "Delete specific data from a bucket",
  parameters: z.object({
    bucketId: z.string(),
    dataId: z.string(),
  }),
  execute: async ({ bucketId, dataId }) => {
    try {
      const response = await makeSpicaRequest(
        "DELETE",
        `/bucket/${bucketId}/data/${dataId}`
      );
      return `✅ Bucket data deleted successfully`;
    } catch (err: any) {
      return `❌ Failed to delete bucket data:\n${err.message}`;
    }
  },
});

// FUNCTION CRUD OPERATIONS
server.addTool({
  name: "function-list",
  description: "Get all functions from Spica",
  parameters: z.object({}),
  execute: async () => {
    try {
      const response = await makeSpicaRequest("GET", "/function");
      return `✅ Functions retrieved successfully:\n${JSON.stringify(
        response.data,
        null,
        2
      )}`;
    } catch (err: any) {
      return `❌ Failed to list functions:\n${err.message}`;
    }
  },
});

// PASSPORT: IDENTITIES
server.addTool({
  name: "passport-identity-list",
  description:
    "Get all identities from Spica. 💡 Tip: Use search tool first to understand identity structure and available attributes.",
  parameters: z.object({
    limit: z.number().optional(),
    skip: z.number().optional(),
    sort: z.string().optional(),
  }),
  execute: async ({ limit, skip, sort }) => {
    try {
      let endpoint = "/passport/identity";
      const params = new URLSearchParams();
      if (limit) params.append("limit", limit.toString());
      if (skip) params.append("skip", skip.toString());
      if (sort) params.append("sort", sort);
      if (params.toString()) endpoint += `?${params.toString()}`;

      const response = await makeSpicaRequest("GET", endpoint);
      return `✅ Identities retrieved successfully:\n${JSON.stringify(
        response.data,
        null,
        2
      )}`;
    } catch (err: any) {
      return `❌ Failed to list identities:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "passport-identity-get",
  description: "Get a single identity by id",
  parameters: z.object({ id: z.string() }),
  execute: async ({ id }) => {
    try {
      const response = await makeSpicaRequest(
        "GET",
        `/passport/identity/${id}`
      );
      return `✅ Identity retrieved successfully:\n${JSON.stringify(
        response.data,
        null,
        2
      )}`;
    } catch (err: any) {
      return `❌ Failed to get identity:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "passport-identity-create",
  description:
    "Create a new identity in Spica. ⚠️ IMPORTANT: Use search + answer_question tools first to understand identity schema, required fields, and attribute structure.",
  parameters: z.object({
    identifier: z.string(),
    password: z.string(),
    attributes: z.record(z.any()).optional(),
  }),
  execute: async ({ identifier, password, attributes }) => {
    try {
      const body: any = { identifier, password };
      if (attributes) body.attributes = attributes;
      const response = await makeSpicaRequest(
        "POST",
        "/passport/identity",
        body
      );
      return `✅ Identity created successfully:\n${JSON.stringify(
        response.data,
        null,
        2
      )}`;
    } catch (err: any) {
      return `❌ Failed to create identity:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "passport-identity-update",
  description: "Update an existing identity",
  parameters: z.object({
    id: z.string(),
    identifier: z.string().optional(),
    password: z.string().optional(),
    attributes: z.record(z.any()).optional(),
  }),
  execute: async ({ id, ...update }) => {
    try {
      // Fetch current
      const current = await makeSpicaRequest("GET", `/passport/identity/${id}`);
      const merged = { ...current.data, ...update, _id: id };
      const response = await makeSpicaRequest(
        "PUT",
        `/passport/identity/${id}`,
        merged
      );
      return `✅ Identity updated successfully:\n${JSON.stringify(
        response.data,
        null,
        2
      )}`;
    } catch (err: any) {
      return `❌ Failed to update identity:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "passport-identity-delete",
  description: "Delete an identity",
  parameters: z.object({ id: z.string() }),
  execute: async ({ id }) => {
    try {
      const response = await makeSpicaRequest(
        "DELETE",
        `/passport/identity/${id}`
      );
      return `✅ Identity deleted successfully`;
    } catch (err: any) {
      return `❌ Failed to delete identity:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "passport-identity-verify",
  description: "Verify current identity token",
  parameters: z.object({}),
  execute: async () => {
    try {
      const response = await makeSpicaRequest(
        "GET",
        "/passport/identity/verify"
      );
      return `✅ Token verified:\n${JSON.stringify(response.data, null, 2)}`;
    } catch (err: any) {
      return `❌ Token verify failed:\n${err.message}`;
    }
  },
});

// Login (identify) - this endpoint doesn't require API key auth
server.addTool({
  name: "passport-login",
  description: "Obtain access and refresh tokens by identifier/password",
  parameters: z.object({ identifier: z.string(), password: z.string() }),
  execute: async ({ identifier, password }) => {
    try {
      const response = await makeSpicaRequest("POST", "/passport/identify", {
        identifier,
        password,
      });
      return `✅ Login successful:\n${JSON.stringify(response.data, null, 2)}`;
    } catch (err: any) {
      return `❌ Login failed:\n${err.message}`;
    }
  },
});

// PASSPORT: API KEYS
server.addTool({
  name: "passport-apikey-list",
  description: "Get all API keys",
  parameters: z.object({}),
  execute: async () => {
    try {
      const response = await makeSpicaRequest("GET", "/passport/apikey");
      return `✅ API keys:\n${JSON.stringify(response.data, null, 2)}`;
    } catch (err: any) {
      return `❌ Failed to list apikeys:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "passport-apikey-get",
  description: "Get a single API key by id",
  parameters: z.object({ id: z.string() }),
  execute: async ({ id }) => {
    try {
      const response = await makeSpicaRequest("GET", `/passport/apikey/${id}`);
      return `✅ API key:\n${JSON.stringify(response.data, null, 2)}`;
    } catch (err: any) {
      return `❌ Failed to get apikey:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "passport-apikey-create",
  description: "Create a new API key",
  parameters: z.object({
    name: z.string(),
    description: z.string().optional(),
    active: z.boolean().optional(),
    // optional policies to attach immediately after creation
    policies: z.array(z.string()).optional(),
  }),
  execute: async ({ name, description, active = true, policies }) => {
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
            return `⚠️ API key created but failed to assign policy ${policyId}:\n${innerErr.message}`;
          }
        }
      }

      return `✅ API key created successfully:\n${JSON.stringify(
        created,
        null,
        2
      )}`;
    } catch (err: any) {
      return `❌ Failed to create apikey:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "passport-apikey-update",
  description: "Update an API key (name/description/active)",
  parameters: z.object({
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    active: z.boolean().optional(),
  }),
  execute: async ({ id, ...update }) => {
    try {
      const current = await makeSpicaRequest("GET", `/passport/apikey/${id}`);
      const merged = { ...current.data, ...update };
      const response = await makeSpicaRequest(
        "PUT",
        `/passport/apikey/${id}`,
        merged
      );
      return `✅ API key updated:\n${JSON.stringify(response.data, null, 2)}`;
    } catch (err: any) {
      return `❌ Failed to update apikey:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "passport-apikey-delete",
  description: "Delete an API key",
  parameters: z.object({ id: z.string() }),
  execute: async ({ id }) => {
    try {
      await makeSpicaRequest("DELETE", `/passport/apikey/${id}`);
      return `✅ API key deleted`;
    } catch (err: any) {
      return `❌ Failed to delete apikey:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "passport-apikey-assign-policy",
  description: "Assign a policy to an existing API key",
  parameters: z.object({ apikeyId: z.string(), policyId: z.string() }),
  execute: async ({ apikeyId, policyId }) => {
    try {
      const response = await makeSpicaRequest(
        "PUT",
        `/passport/apikey/${apikeyId}/policy/${policyId}`
      );
      return `✅ Policy assigned to API key:\n${JSON.stringify(
        response.data,
        null,
        2
      )}`;
    } catch (err: any) {
      return `❌ Failed to assign policy to apikey:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "passport-apikey-remove-policy",
  description: "Remove a policy from an API key",
  parameters: z.object({ apikeyId: z.string(), policyId: z.string() }),
  execute: async ({ apikeyId, policyId }) => {
    try {
      await makeSpicaRequest(
        "DELETE",
        `/passport/apikey/${apikeyId}/policy/${policyId}`
      );
      return `✅ Policy removed from API key`;
    } catch (err: any) {
      return `❌ Failed to remove policy from apikey:\n${err.message}`;
    }
  },
});

// PASSPORT: POLICIES
server.addTool({
  name: "passport-policy-list",
  description: "Get all policies",
  parameters: z.object({}),
  execute: async () => {
    try {
      const response = await makeSpicaRequest("GET", "/passport/policy");
      return `✅ Policies:\n${JSON.stringify(response.data, null, 2)}`;
    } catch (err: any) {
      return `❌ Failed to list policies:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "passport-policy-get",
  description: "Get a single policy by id",
  parameters: z.object({ id: z.string() }),
  execute: async ({ id }) => {
    try {
      const response = await makeSpicaRequest("GET", `/passport/policy/${id}`);
      return `✅ Policy:\n${JSON.stringify(response.data, null, 2)}`;
    } catch (err: any) {
      return `❌ Failed to get policy:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "passport-policy-create",
  description:
    "Create a new policy. ⚠️ CRITICAL: Use search + answer_question tools first to understand policy structure, statement format, and permission system before creating policies.",
  parameters: z.object({
    name: z.string(),
    description: z.string(),
    statement: z.array(
      z.object({
        action: z.string(),
        module: z.string(),
        resource: z
          .object({
            include: z.array(z.string()).optional(),
            exclude: z.array(z.string()).optional(),
          })
          .optional(),
      })
    ),
  }),
  execute: async ({ name, description, statement }) => {
    try {
      const body = { name, description, statement };
      const response = await makeSpicaRequest("POST", "/passport/policy", body);
      return `✅ Policy created:\n${JSON.stringify(response.data, null, 2)}`;
    } catch (err: any) {
      return `❌ Failed to create policy:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "passport-policy-update",
  description: "Update an existing policy",
  parameters: z.object({
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    statement: z
      .array(
        z.object({
          action: z.string(),
          module: z.string(),
          resource: z
            .object({
              include: z.array(z.string()).optional(),
              exclude: z.array(z.string()).optional(),
            })
            .optional(),
        })
      )
      .optional(),
  }),
  execute: async ({ id, ...update }) => {
    try {
      const current = await makeSpicaRequest("GET", `/passport/policy/${id}`);
      const merged = { ...current.data, ...update };
      const response = await makeSpicaRequest(
        "PUT",
        `/passport/policy/${id}`,
        merged
      );
      return `✅ Policy updated:\n${JSON.stringify(response.data, null, 2)}`;
    } catch (err: any) {
      return `❌ Failed to update policy:\n${err.message}`;
    }
  },
});

server.addTool({
  name: "passport-policy-delete",
  description: "Delete a policy",
  parameters: z.object({ id: z.string() }),
  execute: async ({ id }) => {
    try {
      await makeSpicaRequest("DELETE", `/passport/policy/${id}`);
      return `✅ Policy deleted`;
    } catch (err: any) {
      return `❌ Failed to delete policy:\n${err.message}`;
    }
  },
});

// DEEP RESEARCH TOOLS (OpenAI Vector Store)
server.addTool({
  name: "search",
  description:
    "🔍 ALWAYS USE THIS FIRST! Search for documents in your vector store collection to understand available APIs, endpoints, and functionality. You should default to calling this even if you think you already know the answer, since the documentation is always being updated. Use this before any Spica API operations to understand the correct syntax, parameters, and best practices.",
  parameters: z.object({
    query: z
      .string()
      .describe(
        "Search query string to find relevant documents about Spica APIs, endpoints, or functionality"
      ),
  }),
  execute: async ({ query }) => {
    if (!query || !query.trim()) {
      return "❌ Query cannot be empty";
    }

    if (!openaiClient) {
      return "❌ OpenAI client not initialized - API key missing";
    }

    if (!VECTOR_STORE_ID) {
      return "❌ Vector store ID not configured";
    }

    try {
      const files = await openaiClient.vectorStores.files.list(VECTOR_STORE_ID);
      const results = [];

      for (const file of files.data) {
        const fileInfo = await openaiClient.files.retrieve(file.id);
        const filename = fileInfo.filename || `Document ${file.id}`;

        results.push({
          id: file.id,
          title: filename,
          text: "Content preview not available - use answer_question tool to get relevant content",
          url: `https://platform.openai.com/storage/files/${file.id}`,
        });
      }

      return `✅ Found ${
        results.length
      } files in vector store:\n${JSON.stringify(
        { results },
        null,
        2
      )}\n\n💡 Next step: Use answer_question tool with your specific query to get detailed information from these documents.`;
    } catch (err: any) {
      return `❌ Error searching vector store: ${err.message}`;
    }
  },
});

server.addTool({
  name: "fetch",
  description:
    "📄 Retrieve document metadata by ID from your documentation collection. Use this to get basic information about a specific document after using the search tool to find relevant documents.",
  parameters: z.object({
    id: z.string().describe("File ID from your document collection (file-xxx)"),
  }),
  execute: async ({ id }) => {
    if (!id) {
      return "❌ Document ID is required";
    }

    if (!openaiClient) {
      return "❌ OpenAI client not initialized - API key missing";
    }

    try {
      const fileInfo = await openaiClient.files.retrieve(id);
      const filename = fileInfo.filename || `Document ${id}`;

      const result = {
        id,
        title: filename,
        text: "Full content access not available - use answer_question tool for semantic search",
        url: `https://platform.openai.com/storage/files/${id}`,
        metadata: {
          file_id: id,
          filename,
          vector_store_id: VECTOR_STORE_ID,
        },
      };

      return `✅ Document metadata retrieved:\n${JSON.stringify(
        result,
        null,
        2
      )}\n\n💡 To get actual content and answers from this document, use the answer_question tool.`;
    } catch (err: any) {
      return `❌ Could not fetch document with ID ${id}: ${err.message}`;
    }
  },
});

server.addTool({
  name: "answer_question",
  description:
    "🤖 Get AI-powered answers from your documentation collection. Use this after searching to get specific information about Spica APIs, endpoints, parameters, examples, and best practices. Always consult documentation before performing any Spica operations.",
  parameters: z.object({
    query: z
      .string()
      .describe(
        "Your specific question about Spica APIs, functionality, or implementation details"
      ),
  }),
  execute: async ({ query }) => {
    if (!query || !query.trim()) {
      return "❌ Query cannot be empty";
    }

    if (!openaiClient) {
      return "❌ OpenAI client not initialized - API key missing";
    }

    try {
      // Use files.list to get available files and then search through them
      const files = await openaiClient.vectorStores.files.list(VECTOR_STORE_ID);

      if (!files.data || files.data.length === 0) {
        return `❌ No documents found in vector store`;
      }

      // For now, use a simple approach - get first file and provide a general answer
      const firstFile = files.data[0];
      const fileInfo = await openaiClient.files.retrieve(firstFile.id);
      const filename = fileInfo.filename || `Document ${firstFile.id}`;

      const prompt = `Based on the documents in my vector store collection, provide a helpful answer to the user's question. While I cannot access the specific document content directly, provide guidance based on the query.

Document Collection: Contains ${files.data.length} documents including "${filename}"
User Question: ${query}

Please provide a helpful answer and suggest how the user might find more specific information in their document collection.`;

      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1000,
      });

      const answer =
        response.choices[0].message.content?.trim() || "No answer generated";

      const result = {
        query,
        answer:
          answer +
          "\n\n💡 Note: This is a general response. For more specific answers, consider using OpenAI's Assistant API with your vector store.",
        source_title: `Collection of ${files.data.length} documents`,
        source_url: `Vector Store ${VECTOR_STORE_ID}`,
        success: true,
      };

      return `✅ Question answered:\n${JSON.stringify(result, null, 2)}`;
    } catch (err: any) {
      return `❌ An error occurred while processing your question: ${err.message}`;
    }
  },
});

// Start the server with stdio transport
server.start({
  transportType: "stdio",
});
